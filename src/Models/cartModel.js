const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId

const cardSchema = new mongoose.Schema({
    usedId:{
        type:ObjectId,
        ref:'User',
        required:true,
        trim:true,
        unique: true
    },
    items:[{
        productId:{
            type:ObjectId,
            ref:'product',
            required: true,
            trim : true
        },
        quantity:{
            type:Number,
            required:true,
            trim:true,
            min:1
        }
    }],
    totalPrice:{
        type:Number,
        required:true,
        trim:true,         // comment: "Holds total price of all the items in the cart"
    },
    totalItems:{
        type:Number,
        required:true,
        trim:true,       //comment: "Holds total number of items in the cart"
    },
},{timestams:true})

module.exports = mongoose.model('Card',cardSchema)