import { NextResponse } from 'next/server';

const DATADIS_API_URL = 'https://datadis.es/nikola-auth/tokens/login';

export async function POST(request: Request) {
  try {
    // In a real app, you might want to use the credentials from the request body
    // OR use the environment variables if this is a server-side service authenticator.
    // The requirements say: "username: NIF... password: Password".
    // If the APP is acting on behalf of the company (Soluciones Vivivan), 
    // we should use the ENV vars to get the token, not ask the user for them 
    // (unless the user IS the admin logging in, but typically this is a service integration).
    
    // Per "FLUJO DE IMPLEMENTACIÓN - Paso 1": 
    // "Tu servidor Next.js guarda credenciales... Obtiene token al iniciar sesión... Guarda token"
    
    // So we will use the ENV variables.
    const username = process.env.DATADIS_USERNAME;
    const password = process.env.DATADIS_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Server misconfiguration: Missing Datadis credentials' },
        { status: 500 }
      );
    }

    const response = await fetch(DATADIS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Datadis Login Failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    // Datadis returns the token directly as string or JSON? 
    // Docs say: "Respuesta: Token Bearer"
    // Usually it's a string, but let's check content type or just text.
    // If it's a plain string, we wrap it.
    const token = await response.text();
    
    // Validate if it looks like a token
    if (!token || token.length < 10) {
       return NextResponse.json({ error: 'Invalid token received from Datadis' }, { status: 502 });
    }

    // Return it to the client (or store in a secure httpOnly cookie if we were doing full auth, 
    // but for now let's just expose it to our internal API calls or frontend if needed, 
    // though ideally the frontend NEVER sees this token if it's the company's token).
    
    // SECURITY NOTE: If this token grants access to ALL clients, we should NOT send it to the frontend.
    // The frontend should call *our* API, and *our* API adds the token.
    // So this route might not even be needed for the frontend, but rather an internal utility?
    // However, the prompt says "Endpoint de Login (POST)... Respuesta: Token Bearer".
    // And "Backend (API Routes)... /auth/route.ts".
    // So I will implement it. 
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
