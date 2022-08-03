const cartModel = require('../Models/cartModel');
const productModel = require('../Models/productModel')
const userModel = require("../Models/userModel");
const { isValidRequestBody, isEmpty, isValidObjectId, checkImage, stringCheck, numCheck, anyObjectKeysEmpty, } = require("../Utilites/validation");

const createCart = async function (req, res) {
    try {
        let data = req.body;

        let validuserId = req.params.userId
        if (!isValidObjectId(validuserId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params" });
        }
        const user = await userModel.findOne({ _id: validuserId })
        if (!user) {
            return res.status(404).send({ status: false, message: `user not found` })
        }
        let tokenUserId = req.decodeToken.userId;
        if (user._id.toString() !== tokenUserId) {
            return res.status(403).send({ status: false, message: "Unauthorized access" });
        }
        if (isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Invalid request body" });
        }
        data.userId = validuserId
        if (isEmpty(data.productId)) {
            return res.status(400).send({ status: false, message: " productId is required" });
        }
        if (!isValidObjectId(data.productId)) {
            return res.status(400).send({ status: false, message: "Product ID is not valid" })
        }
        const product = await productModel.findOne({ _id: data.productId, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, message: `product not found` })
        }
        data.items = req.body
        data.totalPrice = product.price * req.body.quantity
        data.totalItems = Object.keys(data.items).length

        // if (isEmpty(items.quantity)) {
        //     return res.status(400).send({ status: false, message: "In the items quantity is required" });
        // }
        // let quantityvalidate = /^[0-9]$/.test(items.quantity)
        // if (!quantityvalidate) {
        //     return res.status(400).send({ status: false, message: "Quantity should only be number" })
        // }
        // if (isEmpty(totalPrice)) {
        //     return res.status(400).send({ status: false, message: "TotalPrice is required" });
        // }
        // if (!(/^[0-9]{1,4}(?:\.[0-9]{1,4})?$/.test(items.totalPrice))) {
        //     return res.status(400).send({ status: false, message: "TotalPrice should only be number" })
        // }
        // if (isEmpty(totalItems)) {
        //     return res.status(400).send({ status: false, message: "Totalitems is required" });
        // }
        // if (!(/^[0-9]$/.test(items.totalItems))) {
        //     return res.status(400).send({ status: false, message: "Totalitems should only be number" })
        // }
        const createdcart = await cartModel.create(data)
        res.status(201).send({ status: true, message: "Cart created successfully", data: createdcart })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
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