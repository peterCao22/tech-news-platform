require('dotenv').config({path:'../../.env'});
const{PrismaClient}=require('@tech-news-platform/database/src/generated');
const db=new PrismaClient();
const d=new Date();
d.setDate(d.getDate()-7);
db.content.findMany({
  where:{createdAt:{gte:d},contentScore:{isNot:null}},
  include:{contentScore:true}
}).then(r=>{
  const over30=r.filter(c=>c.contentScore.totalScore>=30);
  const over50=r.filter(c=>c.contentScore.totalScore>=50);
  console.log('过去7天已评分:',r.length);
  console.log('评分>=30:',over30.length);
  console.log('评分>=50:',over50.length);
  if(over30.length>0){
    const scores=over30.map(c=>c.contentScore.totalScore).sort((a,b)=>b-a);
    console.log('TOP10评分:',scores.slice(0,10).map(s=>s.toFixed(2)));
  }
}).then(()=>db.$disconnect()).catch(e=>console.error(e));

