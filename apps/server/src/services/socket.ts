import { Server } from "socket.io";
import { Redis } from "ioredis";
import {produceMessage} from "./kafka";

const pub = new Redis({
    host: 'url',
    port: 22625,
    username: 'default',
    password: ''
});
const sub = new Redis(
    {
        host: 'url',
        port: 22625,
        username: 'default',
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

        sub.on('message', async (channel, message) => {
            if (channel === 'MESSAGES') {
                console.log("New Message from redis", message);
                io.emit('message', message);
                // DB storage
                // await prismaClient.message.create({
                //     data: {
                //         text: message
                //     }
                // });

                //Send to kafka
                await produceMessage(message);
                console.log("Message produced to Kafka Broker");
            }
        });

    }

    get io() {
        return this._io;
    }
}

export default SocketService;