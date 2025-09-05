import dotenv from "dotenv";
dotenv.config({
  path:'./.env'
})

import {app} from "./app.js";
import connectDB from "./db/index.js";
  const PORT = process.env.PORT || 7000;
// 

connectDB().then(() => {

  // const app = express();
    app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
  console.log('first')

}).catch((err)=>{
   console.log('error account while database connect to express',err)
});


