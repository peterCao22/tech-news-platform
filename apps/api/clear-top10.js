require('dotenv').config({path:'../../.env'});
const{PrismaClient}=require('@tech-news-platform/database/src/generated');
const db=new PrismaClient();
db.dailyTop10.deleteMany().then(r=>console.log('删除',r.count,'条TOP10记录')).then(()=>db.$disconnect()).catch(e=>console.error(e));

