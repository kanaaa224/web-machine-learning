export const call = async (endpoint = '', queries = {}, requestBody = null) => {
    const url = new URL(endpoint);

    for(const [ key, value ] of Object.entries(queries)) url.searchParams.set(key, value);

    let request = { method: 'GET' };

    if(requestBody) request = { method: 'POST', body: JSON.stringify(requestBody) };

    const response = await fetch(url.toString(), request);
    const body     = await response.json();

    if(!response.ok) throw new Error(`api-bad-status: ${response.status}`);

    return body;
};