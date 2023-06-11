const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000
const dotenv = require('dotenv').config()
const stripe = require("stripe")(`${process.env.Stripe_sk}`)
const jwt = require('jsonwebtoken');


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

const verifyToken = (req, res, next) => {
    const token = req.headers?.authorization
    if (!token) {
        return res.status(401).send({ error: true })
    }
    jwt.verify(token, process.env.jwt_secret, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true })
        }
        req.decoded = decoded
        next()
    });
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const users = client.db("shikho").collection("shikho_users");
        const classes = client.db("shikho").collection("shikho_class");
        const cart = client.db("shikho").collection("shikho_cart");
        const pay = client.db("shikho").collection("shikho_payment");
        app.get('/users', verifyToken, async (req, res) => {
            const result = await users.find()
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.put('/users/:id',verifyToken, async (req, res) => {
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
        app.put('/instractor/:email', verifyToken, async (req, res) => {
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

        app.post('/class', verifyToken, async (req, res) => {
            const body = req.body
            const result = await classes.insertOne(body)
            res.send(result)
        })
        app.get('/class', verifyToken, async (req, res) => {
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
        app.put('/class_details/:id', verifyToken, async (req, res) => {
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
        app.get('/class/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            const quary = { email: email }
            const result = await classes.find(quary)
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.post('/carts',verifyToken,  async (req, res) => {
            const body = req.body
            const result = await cart.insertOne(body)
            res.send(result)
        })
        app.get('/carts/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            const quary1 = { studentEmail: email }
            const quary2 = { payment: false }
            const result = await cart.find({ $and: [quary1, quary2] })
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.get('/enroll/:email',verifyToken, async (req, res) => {
            const email = req.params.email
            const quary1 = { studentEmail: email }
            const quary2 = { payment: true }
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
        app.get('/all_instractor', async (req, res) => {
            const quary = { role: 'instractor' }
            const result = await users.find(quary)
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.put('/carts/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const quary1 = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: { payment: true }
            };
            const result = await cart.updateOne(quary1, updateDoc, options);
            res.send(result)
        })
        app.post('/payment',verifyToken, async (req, res) => {
            const body = req.body
            const result = await pay.insertOne(body)
            res.send(result)

        })
        app.get('/payment/:email',verifyToken, async (req, res) => {
            const email = req.params.email
            const quary = { email: email }
            const result = await pay.find(quary).sort({ date: -1 })
            const toArray = await result.toArray()
            res.send(toArray)

        })
        app.delete('/carts/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const quary = { _id: new ObjectId(id) }
            const result = await cart.deleteOne(quary)
            res.send(result)
        })
        app.get('/populer_class',  async (req, res) => {
            const quary = { status: 'approved' }
            const result = await classes.find(quary).sort({ enroll: -1 }).limit(6)
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.get('/populer_instractor', async (req, res) => {
            const quary = { role: 'instractor' }
            const result = await users.find(quary).sort({ enroll: -1 }).limit(6)
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token =
                jwt.sign({
                    data: user
                }, process.env.jwt_secret, { expiresIn: '1h' });
            res.send({ token })

        })
        app.post("/create-payment-intent", verifyToken, async (req, res) => {
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
