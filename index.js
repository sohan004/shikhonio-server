const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000
const dotenv = require('dotenv').config()
const stripe = require("stripe")(`${process.env.Stripe_sk}`)


app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.User_id}:${process.env.User_pass}@cluster0.bitxn0d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const users = client.db("shikho").collection("shikho_users");
        const classes = client.db("shikho").collection("shikho_class");
        const cart = client.db("shikho").collection("shikho_cart");
        const pay = client.db("shikho").collection("shikho_payment");
        app.get('/users', async (req, res) => {
            const result = await users.find()
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.put('/users/:id', async (req, res) => {
            const id = req.params.id
            const body = req.body
            const quary = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: body,
            };
            const result = await users.updateOne(quary, updateDoc, options);
            res.send(result)
        })
        app.put('/instractor/:email', async (req, res) => {
            const email = req.params.email
            const quary = { email: email }
            const options = { upsert: true }
            const result = await users.updateOne(quary, { $inc: { enroll: 1 } }, options);
            res.send(result)
        })
        app.get('/role', async (req, res) => {
            const email = req.query?.email
            const toArray = await users.findOne({ email: email })
            if (toArray) {
                res.send(toArray)
            } else {
                res.send({})

            }
        })
        app.post('/users', async (req, res) => {
            const body = req.body
            const quary = { email: body.email }
            const result = await users.findOne(quary)
            if (result) {
                res.send({ insertedId: true })
            }
            else {
                const insert = await users.insertOne(body)
                res.send(insert)
            }

        })

        app.post('/class', async (req, res) => {
            const body = req.body
            const result = await classes.insertOne(body)
            res.send(result)
        })
        app.get('/class', async (req, res) => {
            const result = classes.find()
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.get('/approve_class', async (req, res) => {
            const quary = { status: 'approved' }
            const result = await classes.find(quary)
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.get('/class_details/:id', async (req, res) => {
            const id = req.params.id
            const quary = { _id: new ObjectId(id) }
            const result = await classes.findOne(quary)
            if (result) {
                res.send(result)
            }
            else {
                res.send({})
            }
        })
        app.put('/class_details/:id', async (req, res) => {
            const id = req.params.id
            const quary = { _id: new ObjectId(id) }
            const body = req.body
            const options = { upsert: true }
            const updateDoc = {
                $set: body,
            };
            const result = await classes.updateOne(quary, updateDoc, options)
            res.send(result)
        })
        app.get('/class/:email', async (req, res) => {
            const email = req.params.email
            const quary = { email: email }
            const result = await classes.find(quary)
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.post('/carts', async (req, res) => {
            const body = req.body
            const result = await cart.insertOne(body)
            res.send(result)
        })
        app.get('/carts/:email', async (req, res) => {
            const email = req.params.email
            const quary1 = { studentEmail: email }
            const quary2 = { payment: false }
            const result = await cart.find({ $and: [quary1, quary2] })
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.get('/cart/:id', async (req, res) => {
            const id = req.params.id
            const quary1 = { _id: new ObjectId(id) }
            const result = await cart.findOne(quary1)
            res.send(result)
        })
        app.put('/carts/:id', async (req, res) => {
            const id = req.params.id
            const quary1 = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: { payment: true }
            };
            const result = await cart.updateOne(quary1, updateDoc, options);
            res.send(result)
        })
        app.post('/payment', async (req, res) => {
            const body = req.body
            const result = await pay.insertOne(body)
            res.send(result)

        })
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id
            const quary = { _id: new ObjectId(id) }
            const result = await cart.deleteOne(quary)
            res.send(result)
        })
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: +price * 100,
                payment_method_types: ["card"],
                currency: "usd",
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });
        // ************************************
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is runnning')
})

app.listen(port)
