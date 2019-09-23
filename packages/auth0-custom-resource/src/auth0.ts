import axios from 'axios';

export const getBearerToken = async (
  domain: string,
  clientId: string,
  clientSecret: string,
) => {
  const response = await axios.post(`https://${domain}/oauth/token`, {
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    audience: `https://${domain}/api/v2/`,
  });

  return response.data.access_token;
};

export interface Result {
  name: string;
  client_id: string;
  client_secret: string;
}

export const createClient = async (
  domain: string,
  body: Record<string, unknown>,
  token: string,
) => {
  const response = await axios.post(`https://${domain}/api/v2/clients`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data as Result;
};

export const updateClient = async (
  domain: string,
  clientId: string,
  body: Record<string, unknown>,
  token: string,
) => {
  const response = await axios.patch(
    `https://${domain}/api/v2/clients/${clientId}`,
    body,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data as Result;
};

export const deleteClient = async (
  domain: string,
  clientId: string,
  token: string,
) => {
  const response = await axios.delete(
    `https://${domain}/api/v2/clients/${clientId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data as Result;
};
