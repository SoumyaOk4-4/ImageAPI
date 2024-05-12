const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUrl = process.env.MONGO_URL;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const imageSchema = mongoose.Schema({
    name: String,
    image: {
        data: Buffer,
        contentType: String,
    },
});

const imageModel = mongoose.model("images", imageSchema);

const Storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    }
});

const uploads = multer({
    storage: Storage,
}).single();

// crud

// Retrieve all images
app.get('/images', async (req, res) => {
    try {
        const images = await imageModel.find();
        res.status(200).json(images);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error.');
    }
});

// Retrieve a specific image by ID
app.get('/images/:id', async (req, res) => {
    try {
        const image = await imageModel.findById(req.params.id);
        if (!image) {
            return res.status(404).send('Image not found.');
        }
        res.status(200).json(image);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error.');
    }
});

app.post('/uploads', async (req, res) => {
    uploads(req, res, (err) => {
        if (err) {
            console.log(err);
            return res.status(400).send('Error uploading file.');
        } else {
            const newImage = new imageModel({
                name: req.body.name,
                image: {
                    data: req.file.filename,
                    contentType: 'image/png',
                }
            });

            newImage
                .save()
                .then(() => {
                    console.log('Image uploaded successfully.');
                    //detete after 1 min
                    setTimeout(()=>{
                        const filePath = 'uploads/' + req.file.filename;
                        fs.unlink(filePath,(err)=>{
                            if(err){
                                console.log(err);
                            }
                        });
                    },30000) //60000 mil-sec = 1 min
                    return res.status(200).send('Image uploaded successfully.');
                })
                .catch((err) => {
                    console.log(err);
                    return res.status(500).send('Internal Server Error.');
                });
        }
    });
});

app.put('/images/:id', async (req, res) => {
    try {
        const { name, image } = req.body;
        const updatedImage = await imageModel.findByIdAndUpdate(req.params.id, { name, image }, { new: true , runValidators: true});
        if (!updatedImage) {
            return res.status(404).send('Image not found.');
        }
        res.status(200).json(updatedImage);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error.');
    }
});

app.delete('/images/:id', async (req, res) => {
    try {
        const deletedImage = await imageModel.findByIdAndDelete(req.params.id);
        if (!deletedImage) {
            return res.status(404).send('Image not found.');
        }
        res.status(200).send('Image deleted successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error.');
    }
});


//db setup
mongoose.connect(mongoUrl).then(() => {
    try {
        console.log('db connected');
        app.listen(port, () => {
            console.log("running...");
        });
    } catch (err) {
        console.log(err);
    }
}).catch((err) => {
    console.log(err);
});
