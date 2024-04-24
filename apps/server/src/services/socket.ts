import { Server } from "socket.io";
import { Redis } from "ioredis";
import { channel } from "diagnostics_channel";

const pub = new Redis({
    host: '',
    port: 1,
    username: '',
    password: ''
});
const sub = new Redis(
    {
        host: '',
        port: 1,
        username: '',
        password: ''
    }
);

class SocketService {
    private _io: Server;

    constructor() {
        console.log("Init Socket Service...");
        this._io = new Server({
            cors: {
                allowedHeaders: ["*"],
                origin: "*"
            }
        });
        sub.subscribe('MESSAGES');
    }

    public initListeners() {
        const io = this.io;
        io.on("connect", socket => {
            console.log("New Socket Connected", socket.id);
            socket.on('event:message', async ({ message }: { message: string }) => {
                console.log("New message rec", message);
                //Publish this message to redis
                await pub.publish('MESSAGES', JSON.stringify({ message }));
            });
        });

        sub.on('message', (channel, message) => {
            if (channel === 'MESSAGES') {
                console.log("New Message from redis", message);
                io.emit('message', message);
            }
        });

    }

    get io() {
        return this._io;
    }
}

export default SocketService;