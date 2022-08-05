const cartModel = require('../Models/cartModel');
const productModel = require('../Models/productModel')
const userModel = require("../Models/userModel");
const { isValidRequestBody, isEmpty, isValidObjectId, checkImage, stringCheck, numCheck, anyObjectKeysEmpty, } = require("../Utilites/validation");

const createCart = async function (req, res) {
        try {
          let userId = req.params.userId;
          
          if (!(isValidObjectId(userId))) {
            return res.status(400).send({ status: false, message: "Please provide valid User Id" });
        }
          let data = req.body
          if(!(isValidRequestBody(data))){
           return res .status(404).send({status:false,msg:"plz provide the data"})
          }
          let {quantity, productId } = data;
        
          
          if(!(isValid(productId))){
            return res.status(400).send({ status: false, message: "Please provide the product Id" });
      
          }
          if(!(isValidObjectId(productId))){
            return res.status(400).send({ status: false, message: "Please provide valid Product Id" });
      
          }
          let findUser = await userModel.findById({ _id: userId });
      
      
          if (!findUser) {
              return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}` });
          }
      
          let findProduct = await productModel.findOne({ _id: productId, isDeleted: false });
       
          if (!findProduct) {
              return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}` });
          }
        
          let findUserCart = await cartModel.findOne({ userId: userId });
          console.log(findUserCart,"this for cart")
          if (!quantity) {
            quantity = 1;
          }
      
          if (!findUserCart) {
            var cartData = {
                userId: userId,
                items: [
                    {
                        productId: productId,
                        quantity:quantity,
                    },
                ],
                totalPrice: findProduct.price * quantity,
                totalItems: 1,
            };
            let createCart = await cartModel.create(cartData);
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart });
        }
        if (findUserCart) {
      
          let price = findUserCart.totalPrice + (quantity) * findProduct.price;
          let arr = findUserCart.items;
            for (i in arr) {
              if (arr[i].productId.toString() === productId) {
                  arr[i].quantity +=quantity
                  let updatedCart = {
                      items: arr,
                      totalPrice: price,
                      totalItems: arr.length,
                  };
      
                  let responseData = await cartModel.findOneAndUpdate(
                      { _id: findUserCart._id },
                      updatedCart,
                      { new: true }
                  );
                  console.log(responseData);
                  return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });
              }
          }
          arr.push({ productId: productId, quantity: quantity });
          let updatedCart = {
            items: arr,
            totalPrice: price,
            totalItems: arr.length,
        };
      
        let responseData = await cartModel.findOneAndUpdate({ _id: findUserCart._id }, updatedCart, { new: true });
        return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });
      }
      } catch (error) {
          return res.status(500).send({msg:error.message})
        }
      }

const getCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(usedId))
            return res.status(400).send({ status: false, message: "Invalid userId in params " })

        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

        let tokenUserId = req.decodeToken.userId;
        if (user._id.toString() !== tokenUserId) {
            return res.status(403).send({ status: false, message: "Unauthorized access" });
        }


        let validCard = await cardModel.findOne({ userId: userId })
        if (!validCard) return res.status(404).send({ status: false, message: "No card found " })

        res.status(200).send({ status: true, message: "Success", data: validCard })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(usedId))
            return res.status(400).send({ status: false, message: "Invalid userId in params " })

        let validUser = await userModel.findById({ _id: userId })
        if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

        let tokenUserId = req.decodeToken.userId;
        if (user._id.toString() !== tokenUserId) {
            return res.status(403).send({ status: false, message: "Unauthorized access" });
        }

        let validCard = await cardModel.findOne({ userId: userId })
        if (!validCard) return res.status(404).send({ status: false, message: "No card found " })

        let items = []
        let cartDeleted = await cartModel.findByIdAndUpdate({ usedId: userId }, { new: true },
            { $set: { items: items, totalItems: 0, totalPrice: 0 } })

        res.status(200).send({ status: true, message: "Success", data: cartDeleted })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}
module.exports = { createCart, getCart, deleteCart };