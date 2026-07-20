import {
  BrowserCacheLocation,
  PublicClientApplication,
  type Configuration,
} from "@azure/msal-browser";

const clientId = process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID;
const tenantId = process.env.NEXT_PUBLIC_ENTRA_TENANT_ID;
const redirectUri =
  process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI ?? "http://localhost:3000";

if (!clientId || !tenantId) {
  throw new Error("Microsoft Entra configuration is missing.");
}

const configuration: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.SessionStorage,
  },
};

export const msalInstance =
  new PublicClientApplication(configuration);

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "email",
    "https://management.azure.com/user_impersonation",
  ],
};

export const azureTokenRequest = {
  scopes: [
    "https://management.azure.com/user_impersonation",
  ],
};