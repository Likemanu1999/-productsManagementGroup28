const cartModel = require('../Models/cartModel');
const productModel = require('../Models/productModel')
const userModel = require("../Models/userModel");
const { isValidRequestBody, isEmpty, isValidObjectId, checkImage, stringCheck, numCheck, anyObjectKeysEmpty, } = require("../Utilites/validation");

const createCart = async function (req, res) {
    try {

        let data = req.body;
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });

        let userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })

        //getting token from req in auth    
        const tokenUserId = req.decodeToken.userId;
        let { productId, cartId, quantity } = data
        if (isEmpty(productId))
            return res.status(400).send({ status: false, message: "product required" })

        if (!quantity) {
            quantity = 1
        }
        quantity = Number(quantity)
        if (typeof quantity !== 'number')
            return res.status(400).send({ status: false, message: "quantity is number" })
        if (quantity < 1)
            return res.status(400).send({ status: false, message: "quantity cannot be less then 1" })
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid product ID" })
        if (cartId) {
            if (!isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: "Invalid cart ID" })
        }

        //checking for valid user
        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

        if (cartId) {
            var findCart = await cartModel.findOne({ _id: cartId })
            if (!findCart)
                return res.status(404).send({ status: false, message: "Cart does not exists" })
        }

        // user authorization    
        if (validUser._id.toString() !== tokenUserId)
            return res.status(403).send({ status: false, message: "Unauthorized access" });

        //searching for product    
        let validProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!validProduct) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })

        let validCart = await cartModel.findOne({ userId: userId })
        if (!validCart && findCart) {
            return res.status(403).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
        }
        if (validCart) {
            if (cartId) {
                if (validCart._id.toString() != cartId)
                    return res.status(403).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
            }
            let productidincart = validCart.items
            let uptotal = validCart.totalPrice + (validProduct.price * Number(quantity))
            let proId = validProduct._id.toString()
            for (let i = 0; i < productidincart.length; i++) {
                let productfromitem = productidincart[i].productId.toString()

                //updates old product i.e QUANTITY
                if (proId == productfromitem) {
                    let oldQuant = productidincart[i].quantity
                    let newquant = oldQuant + quantity
                    productidincart[i].quantity = newquant
                    validCart.totalPrice = uptotal
                    await validCart.save();
                    // let result = await cartModel.findOne({ _id: userId }).select({ "items._id": 0, __v: 0 })
                    return res.status(200).send({ status: true, message: 'Success', data: validCart })
                }
            }
            //adds new product
            validCart.items.push({ productId: productId, quantity: Number(quantity) })
            let total = validCart.totalPrice + (validProduct.price * Number(quantity))
            validCart.totalPrice = total
            let count = validCart.totalItems
            validCart.totalItems = count + 1
            await validCart.save()
            //let result = await cartModel.findOne({ _id: userId }).select({ "items._id": 0, __v: 0 })
            return res.status(200).send({ status: true, message: 'Success', data: validCart })
        }

        // 1st time cart
        let calprice = validProduct.price * Number(quantity)
        let obj = {
            userId: userId,
            items: [{
                productId: productId,
                quantity: quantity
            }],
            totalPrice: calprice,
        }
        obj['totalItems'] = obj.items.length
        let result = await cartModel.create(obj)
        // let result = await cartModel.findOne({ _id: cartId }).select({ "items._id": 0, __v: 0 })
        return res.status(201).send({ status: true, message: 'Success', data: result })
    }
    catch (err) {
        return res.status(500).send({ status: false, err: err.message });
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