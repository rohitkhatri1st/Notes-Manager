const express=require('express');
const Joi=require('joi');
const Dao=require('./../dao/dao')
const router=express.Router();
const multer=require('multer');
const ObjectId=require('mongodb').ObjectId;


const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null, './uploads');
    },
    filename: (req,file,cb)=>{
        cb(null, file.originalname);    //I AM ASSUMING HERE THAT FRONTEND WILL GIVE ME A UNIQUE NAME EVERYTIME SOMEONE UPLOADS A FILE.
    }
});

const upload=multer({
    storage:storage
});

router.use(express.json());
router.use(express.urlencoded({extended:true}));

/* ROUTER TO LIST ALL NOTES OR A NOTE WITH SEARCH PARAMAETER LIMITED TO A PAGE SIZE. */
router.get('/',async (req,res)=>{
    // console.log('getting the notes...')
  
    const schema = Joi.object({
        pageNumber: Joi.number().required().min(1),
        pageSize: Joi.number().required().min(5).max(20).multiple(5)
    });
    const {error}=schema.validate(req.body);
    if (error){return res.status(400).send('Error:    '+error.message)}
    if(Object.keys(req.query).length===0){
    const notes=await Dao.listAllNotes(parseInt(req.body.pageNumber),parseInt(req.body.pageSize));
    return res.json(notes);
    }
    if(req.query.search){
        const notes= await Dao.searchNotes(req.query.search,parseInt(req.body.pageNumber),parseInt(req.body.pageSize));
       return res.json(notes);
    }
    const err=new Error('Expecting Search query Parameter');
    return res.status(400).send(err.message);
    
});


/*TO GET A NOTE BY GIVEN ID*/
router.get('/:id',async (req,res)=>{    
    if (!ObjectId.isValid(req.params.id)){
       return res.status(400).send((new Error('Please provide a valid input Id')).message)
    }
    const notes=await Dao.getNote(req.params.id);
    res.json(notes||'No data with given Id is Found');
});


/*TO CREATE A NEW NOTE.*/
router.post('/',upload.array('note-attachments') ,async (req,res)=>{
    const requestBody=req.body;
    const attachmentPathArray=[];
    if(req.files){
    for(let i=0; i<req.files.length;i++){
        attachmentPathArray.push(req.files[i].path);
    }
    requestBody.attachmentIds=attachmentPathArray;
    }
    const schema=Joi.object({
        reminderTime:Joi.date(),
        attachmentIds: Joi.array().items(Joi.string()),
        title:Joi.string().required().min(3),
        data:Joi.string()
    });
    const {error} =schema.validate(requestBody);
    if (error){return res.status(400).send(error.message)};
    const note= await Dao.createNote(requestBody.reminderTime, requestBody.attachmentIds, requestBody.title, requestBody.data);
    res.json(note);
});


/*TO UPDATE A NOTE WITH GIVEN ID*/
router.put('/:id',upload.array('note-attachments') ,async (req,res)=>{
    if (!ObjectId.isValid(req.params.id)){
        return res.status(400).send((new Error('Please provide a valid input Id')).message)
    }
    const requestBody=req.body;
    const attachmentPathArray=[];
    if(req.files){
    for(let i=0; i<req.files.length;i++){
        attachmentPathArray.push(req.files[i].path);
    }
    requestBody.attachmentIds=attachmentPathArray;
    }
    const schema=Joi.object({
        reminderTime:Joi.date(),
        attachmentIds: Joi.array().items(Joi.string()),
        title:Joi.string().required().min(3),
        data:Joi.string()
    });
    const {error} =schema.validate(requestBody);
    if (error){return res.status(400).send(error.message)};
    const note= await Dao.updateNote(req.params.id, requestBody.reminderTime, requestBody.attachmentIds, requestBody.title, requestBody.data);
    res.json(note||'No data with given Id is Found');
});

/*TO DELETE A NOTE WITH GIVEN ID*/
router.delete('/:id',async (req,res)=>{
    if (!ObjectId.isValid(req.params.id)){
        return res.status(400).send((new Error('Please provide a valid input Id')).message);
    }
    const note=await Dao.removeNote(req.params.id);
    return res.send(note||'No data with given Id is found');
})


module.exports=router;