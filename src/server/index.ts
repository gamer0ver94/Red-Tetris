import {build_server} from './app/build_server.ts'

//Main server entrypoint
const start = async () => {
   const app = await build_server();
   await app.listen({
        port: 1800,
        host: '0.0.0.0' // needs to get from env 
    });
}

// entrypoint call
function main(){
    start().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

main();
