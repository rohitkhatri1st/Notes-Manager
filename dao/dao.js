//Data access Object
const cron=require('node-cron');
const mongoose=require('mongoose');
const { date } = require('joi');
mongoose.connect('mongodb://localhost/notesManager',{useNewUrlParser:true, useUnifiedTopology:true})
.then(()=>console.log('Connection to database successful...'))
.catch((err)=>console.log('Connection to database failed due to: ',err));


/*
 * * * * * *
  | | | | | |
  | | | | | day of week
  | | | | month
  | | | day of month
  | | hour
  | minute
  second ( optional )
*/
// cron.schedule("*/10 * * * * *", ()=>{
//     console.log('This runs after every 10 seconds');// After every 10 seconds when this program is executed.
// });

// cron.schedule('10 * * * * *',()=>{
//     console.log('this runs every time when time is some minute and 10 seconds.');//eg. on 5:01:10, 5:02:10
// })

const notesSchema= mongoose.Schema({
    // reminderType: {          
    //     isReminder:{
    //         type: Boolean,
    //         default: false
    //     },
    //     time: Date
    // },
    //RATHER THAN DEFINING LIKE ABOVE WE CAN DO AS BELOW AS IF TIME IS NULL THEN NO REMINDER
    reminder: {
        time:{
            type: Date,
            default:null
        },
        isSeen:{
            type:Boolean,
            default:false,
        },
        // callbackURL: String
    },
    attachmentIds: {
        type: [String],
        default: null
    },
    title:{
        type:String,
        required:true,
    },
    isCreatedAt:{type:Date, default:Date.now},
    lastUpdatedOn: {
        type:Date,
        default:null
    },
    data: {
        type: String,
        default:null
    }
});
const Note=mongoose.model('Note',notesSchema);


//POST OPERATIONS
async function createNote(reminderTime, attachmentIds, title, data){
    const note=new Note({
        reminder:{
            time:reminderTime
        },
        attachmentIds:attachmentIds,
        title:title,
        data:data
    });
    const result= await note.save();
    // console.log(result);
    return result;
}


//GET OPERATIONS
async function getNote(id){
    const note=await Note.findById(id);
    return note;
}

async function listAllNotes(pageNumber, pageSize){
    const notes= Note.find()
    .select({title:1, _id:1, isCreatedAt:1})           //SENDING ID SO THAT IF WE WANT TO FETCH THAT PARTICULAR TITLE'S NOTE, WE CAN DO SO BY ID ONLY
    .skip((pageNumber-1)*pageSize)      //AS TITLES MIGHT NOT BE UNIQUE.
    .limit(pageSize);
    // .sort({isCreatedAt:1})

    return notes;
}

async function searchNotes(wordInTitle,pageNumber,pageSize){
    const notesTitles=Note.find({title: new RegExp('.*'+wordInTitle+'.*',"i")})
    .skip((pageNumber-1)*pageSize)
    .limit(pageSize)
    .select({title:1,_id:1, isCreatedAt:1});
    return notesTitles;
}

//PUT OPERATIONS
async function updateNote(id,reminderTime, attachmentIds, title, data){
    const note=await Note.findByIdAndUpdate(id,{
        $set:{
            reminder:{
                time:reminderTime
            },
            attachmentIds:attachmentIds,
            title:title,
            data:data,
             lastUpdatedOn:new Date(),
        }
    },{new:true});
    return note;
}

//DELETE OPERATIONS
async function removeNote(id){
    const fs=require('fs');
    const note= await Note.findByIdAndDelete(id,{useFindAndModify:false});
    if(!note){return note;}
    const attachmentPaths=note.attachmentIds;
    for (let i=0;i<attachmentPaths.length;i++){
        fs.unlink(attachmentPaths[i],(err)=>{
            if (err){console.log(err);}
        });
    }
    return note;
}


// cron.schedule("*/10 * * * * *", ()=>{
//     console.log('This runs after every 10 seconds');// After every 10 seconds when this program is executed.
// });


//SCHEDULING A TASK TO REMIND THE USER OF REQUIRED.
cron.schedule("* * * * *", async ()=>{
    // const https=require('https')
    //Some of the Properties of Requests are
    //HOST    PORT   PATH   METHOD   HEADERS
    // https.request((anObjectWithPropertiesOfRequest),(res)=>{
    //     codeOfWhatToDoWithTheResponse
    // })
    //We also need to provide a condition of less than equal to 5 minutes for reminder time.
        const notes=await Note.find({
            "reminder.time":{$gte:new Date()}
        })
        .and({"reminder.isSeen":false});
        console.log(notes);
        
});


module.exports.notesSchema=notesSchema;
module.exports={
    createNote,
    getNote,
    removeNote,
    searchNotes,
    updateNote,
    listAllNotes,   
};








//REst endpoint , Queue, AWS step function, polling