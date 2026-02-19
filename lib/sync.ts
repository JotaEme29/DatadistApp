import { format, startOfMonth, subMonths, subDays } from 'date-fns';
import { datadisService } from '@/lib/datadis';
import { supabase, supabaseAdmin } from '@/lib/supabase';

type SyncClientsResult = {
  clientsFound: number;
  clientsUpserted: number;
  suppliesFound: number;
  suppliesUpserted: number;
  errors: string[];
};

type SyncConsumptionOptions = {
  staleDays?: number;
};

type SyncConsumptionResult = {
  suppliesFound: number;
  suppliesProcessed: number;
  suppliesSkippedFresh: number;
  totalRecordsInserted: number;
  errors: string[];
};

export async function syncClientsFromDatadis(): Promise<SyncClientsResult> {
  const db = supabaseAdmin || supabase;
  const ownerNif = process.env.DATADIS_USERNAME || 'OWNER';
  let authorizations: any[] = [];
  let authorizationsUnavailable = false;

  try {
    const authResponse = await datadisService.listAuthorizations();
    if (!Array.isArray(authResponse)) {
      throw new Error('Invalid authorizations response from Datadis');
    }
    authorizations = authResponse;
  } catch (error: any) {
    // Some Datadis accounts cannot access list-authorization but can read own supplies.
    if (String(error?.message || '').includes('403')) {
      authorizationsUnavailable = true;
    } else {
      throw error;
    }
  }

  const syncResults: SyncClientsResult = {
    clientsFound: authorizations.length,
    clientsUpserted: 0,
    suppliesFound: 0,
    suppliesUpserted: 0,
    errors: [],
  };

  for (const auth of authorizations) {
    if (!auth.nif) continue;

    const { error: clientError } = await db.from('authorized_clients').upsert(
      {
        nif: auth.nif,
        name: auth.name || `Cliente ${auth.nif}`,
        status: auth.authorized ? 'ACTIVE' : 'REVOKED',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'nif' }
    );

    if (clientError) {
      syncResults.errors.push(`Error upserting client ${auth.nif}: ${clientError.message}`);
      continue;
    }
    syncResults.clientsUpserted++;

    try {
      const suppliesData = await datadisService.getSupplies(auth.nif);
      const supplies = suppliesData.supplies || [];
      syncResults.suppliesFound += supplies.length;

      for (const supply of supplies) {
        const { error: supplyError } = await db.from('client_supplies').upsert(
          {
            client_nif: auth.nif,
            cups: supply.cups,
            address: supply.address,
            postal_code: supply.postalCode,
            province: supply.province,
            municipality: supply.municipality,
            distributor_code: String(supply.distributorCode),
            point_type: supply.pointType,
            valid_date_from: supply.validDateFrom,
            valid_date_to: supply.validDateTo,
          },
          { onConflict: 'cups' }
        );

        if (supplyError) {
          syncResults.errors.push(`Error upserting supply ${supply.cups}: ${supplyError.message}`);
        } else {
          syncResults.suppliesUpserted++;
        }
      }
    } catch (err: any) {
      syncResults.errors.push(`Error fetching supplies for ${auth.nif}: ${err.message}`);
    }
  }

  // Fallback for owner account: no authorized clients but own supplies are available.
  if (authorizationsUnavailable || authorizations.length === 0) {
    try {
      const { error: ownerError } = await db.from('authorized_clients').upsert(
        {
          nif: ownerNif,
          name: `Titular ${ownerNif}`,
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'nif' }
      );

      if (ownerError) {
        syncResults.errors.push(`Error upserting owner client ${ownerNif}: ${ownerError.message}`);
        return syncResults;
      }

      syncResults.clientsFound = Math.max(syncResults.clientsFound, 1);
      syncResults.clientsUpserted++;

      const suppliesData = await datadisService.getSupplies();
      const supplies = suppliesData.supplies || [];
      syncResults.suppliesFound += supplies.length;

      for (const supply of supplies) {
        const { error: supplyError } = await db.from('client_supplies').upsert(
          {
            client_nif: ownerNif,
            cups: supply.cups,
            address: supply.address,
            postal_code: supply.postalCode,
            province: supply.province,
            municipality: supply.municipality,
            distributor_code: String(supply.distributorCode),
            point_type: supply.pointType,
            valid_date_from: supply.validDateFrom,
            valid_date_to: supply.validDateTo,
          },
          { onConflict: 'cups' }
        );

        if (supplyError) {
          syncResults.errors.push(`Error upserting owner supply ${supply.cups}: ${supplyError.message}`);
        } else {
          syncResults.suppliesUpserted++;
        }
      }

      if (authorizationsUnavailable) {
        syncResults.errors.push(
          'Datadis /list-authorization returned 403. Fallback to owner supplies was used.'
        );
      }
    } catch (err: any) {
      syncResults.errors.push(`Error fetching owner supplies: ${err.message}`);
    }
  }

  return syncResults;
}

export async function syncConsumptionFromDatadis(
  options: SyncConsumptionOptions = {}
): Promise<SyncConsumptionResult> {
  const db = supabaseAdmin || supabase;
  const ownerNif = process.env.DATADIS_USERNAME || '';
  const staleDays = options.staleDays ?? 0;
  const staleThreshold = staleDays > 0 ? subDays(new Date(), staleDays) : null;

  const { data: supplies, error: suppliesError } = await db.from('client_supplies').select('*');
  if (suppliesError) throw suppliesError;

  const syncResults: SyncConsumptionResult = {
    suppliesFound: supplies?.length || 0,
    suppliesProcessed: 0,
    suppliesSkippedFresh: 0,
    totalRecordsInserted: 0,
    errors: [],
  };

  if (!supplies || supplies.length === 0) {
    return syncResults;
  }

  for (const supply of supplies) {
    try {
      if (staleThreshold && supply.last_sync) {
        const lastSyncDate = new Date(supply.last_sync);
        if (lastSyncDate > staleThreshold) {
          syncResults.suppliesSkippedFresh++;
          continue;
        }
      }

      let startDate = subMonths(new Date(), 12);
      if (supply.last_sync) {
        startDate = startOfMonth(new Date(supply.last_sync));
      }

      const startStr = format(startDate, 'yyyy/MM');
      const endStr = format(new Date(), 'yyyy/MM');
      const isOwnerSupply = !!ownerNif && supply.client_nif === ownerNif;

      const consumptionData = await datadisService.getConsumptionData({
        cups: supply.cups,
        distributorCode: supply.distributor_code,
        pointType: supply.point_type,
        measurementType: 0,
        startDate: startStr,
        endDate: endStr,
        authorizedNif: isOwnerSupply ? undefined : supply.client_nif,
      });

      const records = consumptionData.timeCurve || [];
      if (records.length > 0) {
        // Datadis can return duplicate timestamps; keep one row per cups+date+time.
        const dedupedByTimestamp = new Map<string, any>();
        for (const rec of records) {
          const date = rec.date.replace(/\//g, '-');
          const time = rec.time;
          const key = `${supply.cups}|${date}|${time}`;
          dedupedByTimestamp.set(key, {
            cups: supply.cups,
            date,
            time,
            consumption_kwh: rec.consumptionKWh,
            obtain_method: rec.obtainMethod,
          });
        }
        const payload = Array.from(dedupedByTimestamp.values());

        const { error: insertError } = await db
          .from('consumption_data')
          .upsert(payload, { onConflict: 'cups,date,time' });

        if (insertError) {
          syncResults.errors.push(`Error inserting consumption for ${supply.cups}: ${insertError.message}`);
        } else {
          syncResults.totalRecordsInserted += payload.length;
        }
      }

      await db.from('client_supplies').update({ last_sync: new Date().toISOString() }).eq('id', supply.id);
      syncResults.suppliesProcessed++;
    } catch (err: any) {
      syncResults.errors.push(`Error fetching consumption for ${supply.cups}: ${err.message}`);
    }
  }

  return syncResults;
}
