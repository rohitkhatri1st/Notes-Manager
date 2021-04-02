const express=require('express');
// const cron =require('node-cron');
// const Joi=require('joi');
const notes=require('./routes/notes');
const app=express();
app.use(express.json());

app.use('/uploads',express.static('uploads'));
const port=process.env.PORT||8080;
app.use('/notes',notes);
app.listen(port,()=>console.log(`Listening on port ${port}...`));