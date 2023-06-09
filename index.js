const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000
const dotenv = require('dotenv').config()


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
        app.get('/users', async (req, res) => {
            const result = await users.find()
            const toArray = await result.toArray()
            res.send(toArray)
        })
        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id
            const body = req.body
            const quary = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    role: body.role
                },
            };
            const result = await users.updateOne(quary, updateDoc, options);
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
        app.get('/cart', async (req, res) => {
            const body = req.body
            const result = await cart.insertOne(body)
            res.send(result)
        })
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
