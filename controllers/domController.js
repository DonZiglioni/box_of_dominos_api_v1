import dominos from '../dominos.js';
import * as dotenv from 'dotenv';
dotenv.config();
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.DATABASE_URI;
const client = new MongoClient(uri);
const database = client.db('Dominos');
const boxes = database.collection('Boxes');

export const getNewBox = async (req, res) => {
    let response;
    let id;
    try {
        const box = {
            remaining: 28,
            shuffled: false,
            dominos: dominos,
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
}


export const getNewSet = async (req, res) => {
    let response;
    let id;
    let shuffled = [];
    let temp = dominos.slice();

    while (temp.length > 0) {
        let randomIdx = Math.floor(Math.random() * temp.length);
        temp[randomIdx].isFaceUp = false;
        shuffled.push(temp[randomIdx]);
        temp.splice(randomIdx, 1);
    };

    try {
        const box = {
            remaining: 28,
            shuffled: true,
            dominos: shuffled,
        }
        const result = await boxes.insertOne(box);
        id = result.insertedId;
        if (ObjectId.isValid(result.insertedId)) {
            response = await database.collection('Boxes').findOne({ _id: result.insertedId })
        }
    } catch (error) {
        console.log(error);
    }

    res.status(200).json({ message: `New Set of shuffled dominos with SetId: ${id}`, newSet: response })
}

export const shuffleSet = async (req, res) => {
    const { id } = req.params
    let response;
    let shuffled = [];
    let temp = dominos.slice();

    while (temp.length > 0) {
        let randomIdx = Math.floor(Math.random() * temp.length);
        temp[randomIdx].isFaceUp = false;
        shuffled.push(temp[randomIdx]);
        temp.splice(randomIdx, 1);
    };

    try {
        const sendUpdate = await database.collection('Boxes').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: { dominos: shuffled, remaining: 28, shuffled: true },
                $currentDate: { lastModified: true }
            }
        );
        if (sendUpdate) {
            response = await database.collection('Boxes').findOne({ _id: new ObjectId(id) })
        }
    } catch (error) {
        console.log(error);
    }

    res.status(200).json({ message: `Shuffling Dominos in Set: ${id}`, newSet: response })
}

export const drawDomino = async (req, res) => {
    const { id, count } = req.params
    let updatingRemaining;
    let updatingDominos;
    let selectedDominos = [];
    let response;

    const getSet = await database.collection('Boxes').findOne({ _id: new ObjectId(id) });
    if (getSet) {
        updatingRemaining = getSet.remaining;
        updatingDominos = getSet.dominos.slice();
    }
    for (let i = 0; i < count; i++) {
        updatingRemaining = updatingRemaining - 1
        let randomIdx = Math.floor(Math.random() * updatingDominos.length);
        selectedDominos.push(updatingDominos[randomIdx]);
        updatingDominos.splice(randomIdx, 1);
    }
    try {
        const sendUpdate = await database.collection('Boxes').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: { dominos: updatingDominos, remaining: updatingRemaining },
                $currentDate: { lastModified: true }
            }
        );
        if (sendUpdate) {
            response = await database.collection('Boxes').findOne({ _id: new ObjectId(id) })
        }
    } catch (error) {
        console.log(error);
    }


    res.status(200).json({ message: `You picked up a domino!`, dominos: selectedDominos, remaining: updatingRemaining, response: response })

}
