const cartModel = require('../Models/cartModel');
const productModel = require('../Models/productModel')
const userModel = require("../Models/userModel");
const orderModel = require("../Models/orderModel")
const { isValidRequestBody, isEmpty, isValidObjectId, checkImage, stringCheck, numCheck, anyObjectKeysEmpty, } = require("../Utilites/validation");

const createOrder = async function (req,res){
    try{
        const usedId = req.param.usedId
        if(!isValidObjectId(usedId))
        return res.status(400).send({status : false, message : "Invalid usedId id "})

        const data = req.body
        if(isValidRequestBody(data))
        return res.status(400).send({ status : false , message : " Empty requst body"});

        const { cardId } = data
        if(isEmpty(cardId)) return res.status(400).send({ status : false , message : " CardId is required"})
        if(isValidObjectId(cardId))
        return res.send(400).send({ status : false, message :" Invalid card Id"})

        const findUser = await userModel.findOne({ _id:userId })
        if(!findUser) return res.status(400).send({status : fasle , message : " userId does not exists "})

        const tokenUserId = req.decodeToken.userId;
        if(!tokenUserId !== findUser._id.toString())
        return res.send(403).send({status : false , message : " Unauthorrized access" });

      const findCard = await cartModel.findOne({ usedId : userId })
      if(!findCard) return res.status(404).send({ status: false ,  message : " No card found "});
      if(findCard.items.length === 0 ) return res.status(400).send({ status : false , message : " No items in card "})

      

    }catch (err) {
        return res.status(500).send({ status: false, err: err.message });
    }
}

const updateOrder = async function  (req, res) {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })

        const data = req.body
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Empty request body" })

        const { orderId, status } = data
        if (isEmpty(orderId)) return res.status(400).send({ status: false, message: "Order Id required" })
        if (isEmpty(status)) return res.status(400).send({ status: false, message: "please enter status." })

        if (!isValidObjectId(orderId))
            return res.status(400).send({ status: false, message: "Invalid order ID" })

        const validUser = await userModel.findOne({ _id: userId })
        if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

        const tokenUserId = req.decodeToken.userId;
        if (tokenUserId !== validUser._id.toString())
            return res.status(403).send({ status: false, message: "Unauthorized access" })

        const validOrder = await orderModel.findOne({ _id: orderId })
        if (!validOrder) return res.status(404).send({ status: false, message: "Order does not exists" })




} catch (err) {
    return res.status(500).send({ status: false, err: err.message });
}
}

module.exports = { createOrder, updateOrder }