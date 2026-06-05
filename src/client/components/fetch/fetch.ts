export async function fetchData(path_to_url: string, object: any, method:string) {

      // Build full URL from page origin when a path is supplied
    const url = /^https?:\/\//i.test(path_to_url)
        ? path_to_url
        : new URL(
            path_to_url.startsWith('/') ? path_to_url : `/${path_to_url}`,
            `${window.location.protocol}//${window.location.hostname}:1800`
    ).toString();
    console.log("fetch url", url);
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