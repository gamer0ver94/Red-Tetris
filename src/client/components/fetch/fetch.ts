export async function fetchData(url: string, object: any, method:string) {
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
          console.error(err);
          return null;
        }
}