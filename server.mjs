import "dotenv/config";
import express from "express";
import multer from "multer";
import OpenAI from "openai";

const app=express();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:15*1024*1024,files:2}});
const PORT=process.env.PORT||3000;
const MODEL=process.env.OPENAI_MODEL||"gpt-5.6-luna";
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
app.use(express.static("."));

const schema={
type:"object",additionalProperties:false,
properties:{
card:{type:"object",additionalProperties:false,properties:{
sport:{type:"string"},player:{type:"string"},team:{type:"string"},year:{type:"string"},
manufacturer:{type:"string"},set_name:{type:"string"},card_number:{type:"string"},
rookie:{type:"string"},parallel:{type:"string"},serial_number:{type:"string"},
autograph:{type:"string"},relic:{type:"string"},notable_details:{type:"string"},
visible_condition_notes:{type:"string"},confidence:{type:"string"}},
required:["sport","player","team","year","manufacturer","set_name","card_number","rookie","parallel","serial_number","autograph","relic","notable_details","visible_condition_notes","confidence"]},
social_post:{type:"string"},video_script:{type:"string"},listing_description:{type:"string"},
hashtags:{type:"string"},content_ideas:{type:"array",items:{type:"string"}}
},required:["card","social_post","video_script","listing_description","hashtags","content_ideas"]};

function imageData(file){
 const mime=(file.mimetype||"").toLowerCase();
 if(!["image/jpeg","image/png","image/webp","image/gif"].includes(mime))
   throw new Error("Unsupported image type. Use JPG, PNG, WEBP, or GIF.");
 return `data:${mime};base64,${file.buffer.toString("base64")}`;
}

app.get("/api/health",(req,res)=>res.json({ok:true,model:MODEL,hasKey:Boolean(process.env.OPENAI_API_KEY&&process.env.OPENAI_API_KEY!=="put_your_key_here")}));

app.post("/api/analyze",upload.fields([{name:"front",maxCount:1},{name:"back",maxCount:1}]),async(req,res)=>{
 try{
  if(!process.env.OPENAI_API_KEY||process.env.OPENAI_API_KEY==="put_your_key_here")
   return res.status(500).json({error:"Add your OpenAI API key to the server .env file first."});
  const front=req.files?.front?.[0],back=req.files?.back?.[0];
  if(!front)return res.status(400).json({error:"Please select a card FRONT image."});
  const content=[{type:"input_text",text:`You are Mister E AI, an expert sports trading-card image analyst.
Analyze the supplied card image(s). The first image is FRONT${back?" and the second is BACK":""}.
Read only what is actually visible. Use the back to cross-check year, manufacturer, set, card number, stats, copyright text, numbering, team and special features.
Never invent a player, year, set, number, parallel, serial number, autograph, relic, or other detail. If not readable or not supported by the images, use "Unknown".
Do not assign a professional grade. Only describe visible condition traits.
Generate creator-ready content using confirmed details. Do not claim market value, authenticity, rarity, or investment potential unless explicitly supported by the images.
Return ONLY the requested structured JSON.`},{type:"input_image",image_url:imageData(front),detail:"high"}];
  if(back)content.push({type:"input_image",image_url:imageData(back),detail:"high"});
  const r=await client.responses.create({
    model:MODEL,input:[{role:"user",content}],store:false,
    text:{format:{type:"json_schema",name:"sports_card_content",strict:true,schema}}
  });
  if(!r.output_text)throw new Error("The AI returned no analysis.");
  res.json(JSON.parse(r.output_text));
 }catch(e){console.error(e);res.status(500).json({error:e?.message||"Analysis failed."});}
});
app.listen(PORT,()=>console.log(`Mister E AI V4: http://localhost:${PORT}`));
