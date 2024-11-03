import express, { application } from 'express';
import cors from 'cors';
import { orderRouter } from './routes/order';
import { depthRouter } from './routes/depth';
import { tradesRouter } from './routes/trades';
import { klineRouter } from './routes/kline';


const app = express();
app.use(cors());
app.use(express.json());


app.use("/api/v1/order", orderRouter);
app.use("/api/v1/depth", depthRouter);
app.use("/api/v1/traders", tradesRouter);
app.use("/api/v1/klines", klineRouter);
app.use("/api/v1/tickers", tradesRouter);


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});