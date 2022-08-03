const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({
    userId:{
        type:ObjectId,
        ref:'User'
        
    },
    items:[{
        productId:{
            type:ObjectId,
            ref:'product'
           
        },
        quantity:{
            type:Number,
            min:1
        }
    }],
    totalPrice:{
        type:Number
           // comment: "Holds total price of all the items in the cart"
    },
    totalItems:{
        type:Number
            //comment: "Holds total number of items in the cart"
    },
},{timestams:true})

module.exports = mongoose.model('Cart',cartSchema)