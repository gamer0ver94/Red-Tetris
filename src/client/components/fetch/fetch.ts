import { config } from "../../conf"
export async function fetchData(route: string, object: any, method:string,) {
  const url = `${config.url}${route}`;
  console.log("test" + url)
    const options: RequestInit = {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    };
    if (object != null) {
        options.body = JSON.stringify(object);
    }
    try {
          const res = await fetch(url, options);
          if (!res.ok) {
            throw new Error("Request failed");
          }
    
          const data = await res.json();
          return data;
    
        } catch (err) {
          return null;
        }
}

export async function fetchDataJson(route: string, object: any,token:string) {
  const url = `${config.url}${route}`;
  console.log(url, object, token)
    const res = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": token,
            },
            body: JSON.stringify(object),
        });
        return res
}