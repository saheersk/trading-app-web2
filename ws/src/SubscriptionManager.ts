import { createClient, RedisClientType } from "redis";
import { UserManager } from "./UserManager";


export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private subscriptions: Map<string, string[]> = new Map();
    private reverseSubscriptions: Map<string, string[]> = new Map();
    private redisClient: RedisClientType;

    private constructor() {
        this.redisClient = createClient();
        this.redisClient.connect();
    }

    public static getInstance() {
        if (!this.instance)  {
            this.instance = new SubscriptionManager();
        }
        return this.instance;
    }

    public subscribe(userId: string, subscription: string) {
        // Prevent re-subscribing if already subscribed
        if (this.reverseSubscriptions.has(subscription) && (this.reverseSubscriptions.get(subscription) ?? []).length > 0) {
            console.log(`Channel ${subscription} already subscribed, no need to subscribe again.`);
            return;
        }
    
        // Proceed with subscribing logic
        // Update subscriptions
        this.subscriptions.set(userId, (this.subscriptions.get(userId) || []).concat(subscription));
        this.reverseSubscriptions.set(subscription, (this.reverseSubscriptions.get(subscription) || []).concat(userId));
    
        // Only subscribe to Redis if this is the first user for this channel
        if (this.reverseSubscriptions.get(subscription)?.length === 1) {
            console.log(`Subscribing to Redis channel: ${subscription}`);
            this.redisClient.subscribe(subscription, this.redisCallbackHandler);
        }
    }

    private redisCallbackHandler = (message: string, channel: string) => {
        console.log("channel: " + channel); 
        console.log("message: " + message); 
    
        const parsedMessage = JSON.parse(message);
    
        // Use optional chaining and nullish coalescing to safely check reverseSubscriptions
        const subscribers = this.reverseSubscriptions?.get(channel) ?? [];
        if (subscribers.length === 0) {
            console.warn(`No subscribers found for channel: ${channel}`);
            return;
        }
    
        subscribers.forEach(s => {
            const user = UserManager.getInstance().getUser(s);
            if (user) {
                user.emit(parsedMessage);
            } else {
                console.log(user, "=====================user ws===================");
            }
        });
    }

    public unsubscribe(userId: string, subscription: string) {
        console.log(`Unsubscribing user ${userId} from channel ${subscription}`);
    
        // Check if the user has subscriptions
        const subscriptions = this.subscriptions.get(userId);
        if (subscriptions) {
            console.log(`User ${userId} has subscriptions: ${subscriptions}`);
            this.subscriptions.set(userId, subscriptions.filter(s => s !== subscription));
            console.log(`Updated subscriptions for user ${userId}: ${this.subscriptions.get(userId)}`);
        } else {
            console.log(`User ${userId} has no subscriptions.`);
        }
    
        // Check if the subscription exists in reverseSubscriptions
        const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
        if (reverseSubscriptions) {
            console.log(`Channel ${subscription} has subscribers: ${reverseSubscriptions}`);
            this.reverseSubscriptions.set(subscription, reverseSubscriptions.filter(s => s !== userId));
            console.log(`Updated subscribers for channel ${subscription}: ${this.reverseSubscriptions.get(subscription)}`);
            
            // If no users are subscribed to the channel, unsubscribe from Redis
            if (this.reverseSubscriptions.get(subscription)?.length === 0) {
                console.log(`No more subscribers to channel ${subscription}, unsubscribing from Redis.`);
                this.reverseSubscriptions.delete(subscription);
                this.redisClient.unsubscribe(subscription);
            }
        } else {
            console.log(`Channel ${subscription} has no subscribers.`);
        }
    }
    

    public userLeft(userId: string) {
        console.log("user left " + userId);
        this.subscriptions.get(userId)?.forEach(s => this.unsubscribe(userId, s));
    }
    
    getSubscriptions(userId: string) {
        return this.subscriptions.get(userId) || [];
    }
}