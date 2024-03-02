import dominoSet from './scratchbook.js';

import express from 'express'
import cors from 'cors';
import * as dotenv from 'dotenv';
const app = express();
const PORT = 8080;
app.use(cors());
app.use(express.json({ limit: '50mb' }))
app.use(express.static('public'))
dotenv.config();
import { MongoClient, ObjectId } from 'mongodb';

import router from './routes/bodRoutes.js'

const uri = process.env.DATABASE_URI;
const client = new MongoClient(uri);
const database = client.db('Dominos');
const boxes = database.collection('Boxes');

const randomize = 'abcdefghijklmnopqrstuvwxyz0123456789';
const getRandomId = () => {
    let newId = '';
    for (let i = 0; i < 12; i++) {
        let randomKey = Math.floor(Math.random() * randomize.length);
        newId = newId + randomize[randomKey];
    }
    return newId;
}
const shuffleDominos = (set) => {
    let shuffled = [];
    let temp = set;

    while (temp.length > 0) {
        let randomIdx = Math.floor(Math.random() * temp.length);
        shuffled.push(temp[randomIdx])
        temp.splice(randomIdx, 1)
    }
    return shuffled;
}

//  ****  V1  ****

app.get('/v1', async (req, res) => {
    res.status(200).json({ message: "Hello!" })
})

app.use('/v1/dominos', router)

//  ****  RETURN A NEW, UNSHUFFLED BOX OF DOMINOS  ****

app.get('/v1/newbox', async (req, res) => {
    let response;
    let id;
    try {
        const box = {
            remaining: 28,
            shuffled: false,
            dominos: dominoSet.dominos,
        }
        const result = await boxes.insertOne(box);
        id = result.insertedId;
        if (ObjectId.isValid(result.insertedId)) {
            response = await database.collection('Boxes').findOne({ _id: result.insertedId })
        }
    } catch (error) {
        console.log(error);
    }
    res.status(200).json({ message: `New Box of dominos with SetId: ${id}`, newBox: response })
})

//  ****  RETURN NEW SET OF SHUFFLED DOMINOS  ****

app.get('/v1/shuffledset', async (req, res) => {
    let response;
    let id;
    try {
        const shuffledSet = shuffleDominos(dominoSet.dominos);
        const box = {
            remaining: 28,
            shuffled: true,
            dominos: shuffledSet,
        }
        const result = await boxes.insertOne(box);
        id = result.insertedId;
        if (ObjectId.isValid(result.insertedId)) {
            response = await database.collection('Boxes').findOne({ _id: result.insertedId })
        }
    } catch (error) {
        console.log(error);
    }

    res.status(200).json({ message: `New Box of shuffled dominos with SetId: ${id}`, shuffledSet: response })
})

//  ****  SHUFFLE EXISTING SET OF DOMINOS  ****

app.get('/v1/shuffleset/:id', async (req, res) => {
    const { id } = req.params;
    let newBox;
    try {
        if (ObjectId.isValid(id)) {
            const oldBox = await database.collection('Boxes').findOne({ _id: new ObjectId(id) });
            const shuffledSet = shuffleDominos(oldBox.dominos);
            const updateDoc = {
                $set: {
                    dominos: shuffledSet,
                },
            };
            const result = await database.collection('Boxes').updateOne({ _id: new ObjectId(id) }, updateDoc);
            console.log(result);
            newBox = await database.collection('Boxes').findOne({ _id: new ObjectId(id) });
        }
    } catch (error) {
        console.log(error);
    } finally {
        await client.close();
    }

    res.status(200).json({ message: `Mixing up the dominos in Set: ${id}`, shuffledSet: newBox })
})

app.get('/v1/draw/:id/:count', (req, res) => {
    // const { setId, count = 1 } = JSON.stringify(req.params);
    // let selectedDominos = [];
    // const openBox = dominoSet;
    // openBox.setId = setId;

    // for (let i = 0; i <= count; i++) {
    //     const randomIndex = Math.floor(Math.random() * openBox.dominos.length)
    //     selectedDominos.push(openBox.dominos[randomIndex])
    //     openBox.dominos.splice(randomIndex, 1)
    //     openBox.remaining = openBox.remaining - 1;
    // }

    res.status(200).json({ message: `Drawing Dominos: ${selectedDominos}`, dominoSet: openBox, selectedDominos: selectedDominos })
})

app.listen(PORT, () => {
    console.log("Server is running on PORT: ", PORT);
})