const productModel = require('../Models/productModel')
const { uploadFile } = require("../AWS_S3/awsUpload");
const { isValidRequestBody, isEmpty, isValidObjectId, checkImage, stringCheck, numCheck, anyObjectKeysEmpty,} = require("../Utilites/validation");


const createProduct = async (req, res) => {
    try {
        let data = req.body
        let productImage = req.files;
        
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Form data cannot be empty" });

        //Product Image Validation
        if (productImage.length == 0)
            return res.status(400).send({ status: false, message: "upload product image" });
        if (productImage.length > 1)
            return res.status(400).send({ status: false, message: "only one image at a time" });
        if (!checkImage(productImage[0].originalname))
            return res.status(400).send({ status: false, message: "format must be jpeg/jpg/png only" })

        if (isEmpty(title))
            return res.status(400).send({ status: false, message: "title required" });
        if (!stringCheck(title))
            return res.status(400).send({ status: false, message: "title invalid" });
        if (isEmpty(description))
            return res.status(400).send({ status: false, message: "description required" });

        if (isEmpty(price))
            return res.status(400).send({ status: false, message: "price required" });
        if (price == 0)
            return res.status(400).send({ status: false, message: "price can't be 0" })
        if (!price.match(/^\d{0,8}(\.\d{1,4})?$/))
            return res.status(400).send({ status: false, message: "price invalid" })

        if (!isEmpty(installments)) {
            if (!installments.match(/^[0-9]{1,2}$/))
                return res.status(400).send({ status: false, message: "installment invalid" });
        }

        if (isEmpty(currencyId))
            return res.status(400).send({ status: false, message: "currencyId required" });
        if (currencyId.trim() !== 'INR')
            return res.status(400).send({ status: false, message: "currencyId must be INR only" });

        if (isEmpty(currencyFormat))
            return res.status(400).send({ status: false, message: "currencyFormat required" });
        if (currencyFormat.trim() !== '₹')
            return res.status(400).send({ status: false, message: "currencyformat must be ₹ only" });

        if (typeof isFreeShipping != 'undefined') {
            isFreeShipping = isFreeShipping.trim()
            if (!["true", "false"].includes(isFreeShipping)) {
                return res.status(400).send({ status: false, message: "isFreeshipping is a boolean type only" });
            }
        }
      
        if (isEmpty(availableSizes))  return res.status(400).send({ status: false, message: "availableSizes required" });
    if (availableSizes) {
        let validSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]
        var InputSizes = availableSizes.toUpperCase().split(",").map((s) =>{ return s.trim()})
        for (let i = 0; i < InputSizes.length; i++) {
            if (!validSizes.includes(InputSizes[i])) {
                return res.status(400).send({ status: false, message: "availableSizes must be [S, XS, M, X, L, XXL, XL]" });  }  }
            }

                   
                   
        //DB call
        let uniqueTitle = await productModel.findOne({ title: { $regex: title } })
        if (uniqueTitle) {
            if (uniqueTitle.title.toUpperCase() == title.toUpperCase()) {
                return res.status(400).send({ status: false, message: "title is already exsits" })
            }
        }

        
        let uploadedFileURL = await uploadFile(productImage[0]);
        let obj = {
            title, description, price, currencyId, currencyFormat, isFreeShipping: isFreeShipping, style, installments,availableSizes:[...new Set(InputSizes)], productImage: uploadedFileURL
        }
        let result = await productModel.create(obj)
        return res.status(201).send({ status: true, message: 'Success', data: result })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

const productByid = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid ProductId in params" });

        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })
        res.status(200).send({ status: true, message: "Success", data: product })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

const getProductByFilter = async function (req, res) {
    try {
        let filter = req.query;
        let query = { isDeleted: false };
        if (filter) {
          const { name, description, isFreeShipping, style, size, installments} =
            filter;
        
          if (name) {
           // if (!isEmpty(name)) return res.status(400).send({ status: false, message: "name  must be alphabetic characters" })
            // console.log(name);
            query.title = name;
          }
          if (description) {
          //  if (!isEmpty(description)) return res.status(400).send({ status: false, message: "description  must be alphabetic characters" })
            query.description = description.trim();
    
          }
          if (isFreeShipping) {
              if (!((isFreeShipping === 'true') || (isFreeShipping === 'false'))) {return res.status(400).send({status: false,massage: 'isFreeShipping should be a boolean value'})
          }
            query.isFreeShipping = isFreeShipping;
          }
          if (style) {
            if (!isEmpty(style)) return res.status(400).send({ status: false, message: "style  must be alphabetic characters" })
            query.style = style.trim();
          }
          if (installments) {
            if(!/^[0-9]+$/.test(installments)) return res.status(400).send({ status: false, message: "installments must be in numeric" })
    
            query.installments = installments;
          }
          if (size) {
            let sizes = size.split(/[\s,]+/)
            let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            console.log(sizes)
            for (let i = 0; i < sizes.length; i++) {
                if (arr.indexOf(sizes[i]) == -1)
                    return res.status(400).send({ status: false, message: "availabe sizes must be (S, XS,M,X, L,XXL, XL)" })
            }
            const sizeArr = size
              .trim()
              .split(",")
              .map((x) => x.trim());
            query.availableSizes = { $all: sizeArr };
          }
        }
        if(filter.priceLessThan){
          if (!/^[0-9 .]+$/.test(filter.priceLessThan)) return res.status(400).send({ status: false, message: "priceLessThan must be in numeric" })
        }
        if(filter.priceGreaterThan){
          if (!/^[0-9 .]+$/.test(filter.priceGreaterThan)) return res.status(400).send({ status: false, message: "priceGreaterThan must be in numeric" })
        }
    
        const query1 = await constructQuery(filter); 
        let data = await productModel.find({ ...query, ...query1 }).collation({ locale: "en", strength: 2 }).sort({ price: filter.priceSort });
    
        if (data.length == 0) {
          return res.status(400).send({ status: false, message: "NO data found" });
        }
    
        return res.status(200).send({status: true,message: "Success",count: data.length,data: data});
      } catch (err) {
        return res.status(500).send({ status: false, error: err.message });
      }
    };
    const constructQuery = async (filter) => {
        if (filter.priceGreaterThan && filter.priceLessThan) {
          return {
            $and: [
              { price: { $gt: filter.priceGreaterThan, $lt: filter.priceLessThan } },
            ],
          };
        } else if (filter.priceGreaterThan) {
          return { price: { $gt: filter.priceGreaterThan } };
        } else if (filter.priceLessThan) {
          return { price: { $lt: filter.priceLessThan } };
        }
      };
      
      const deleteByid = async function (req, res) {
        try {
            let productId = req.params.productId
            if (!isValidObjectId(productId))
                return res.status(400).send({ status: false, message: "Invalid ProductId in params" });
    
            let product = await productModel.findOne({ _id: productId, isDeleted: false })
            if (!product) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })
    
            let deleteProduct = await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
            res.status(200).send({ status: true, message: 'Success', data: deleteProduct })
        }
        catch (error) {
            console.log(error.message);
            return res.status(500).send({ status: false, message: error.message });
        }
    }

    const updateProductById = async function(req,res) {

      try{
    
        let productImage = req.files;
    
        const productId =req.params.productId
        if (!isValidObjectId(productId))
        return res.status(400).send({ status: false, message: "Invalid ProductId in params" });
    
          const product = await productModel.findOne({ _id: productId, isDeleted: false })
    
            if (!product) {
                return res.status(404).send({ status: false, message: `product not found` })
            }
    
          
            const updatedData = JSON.parse(JSON.stringify(req.body));
    
         if(isValidRequestBody(updatedData)){
            return res.status(400).send({status:false,message:"request body is empty"})
         }
         const  { title, description, price, currencyId, currencyFormat, isFreeShipping, style, installments,availableSizes } =updatedData;
       
          if(title){
            if(isEmpty(title)){
                return res.status(400).send({status:false,message:"plz provide tilte "})
            
            
            }
            const checkTitle = await productModel.findOne({title:title,isDeleted:false})
             if(checkTitle){
            return res.status(400).send({status:false,message:"title already exist"})
           }
     }
    
        if(description){
        if(isEmpty(description)){
            return res.status(400).send({status:false.valueOf,message:"description is not presented"})
        }
    
       if(price){
        if(isEmpty(price)){
            return res.status(400).send({status:false.valueOf,message:"price is not presented"})
        }
        if (price == 0){
                return res.status(400).send({ status: false, message: "price can't be 0" })
        }
            if (!price.match(/^\d{0,8}(\.\d{1,4})?$/))
                return res.status(400).send({ status: false, message: "price invalid" })
    
       }
       if(installments){
        if (!installments.match(/^[0-9]{1,2}$/))
            return res.status(400).send({ status: false, message: "installment invalid" });
    
       }
         if(style){
         if (isEmpty(style))
            return res.status(400).send({ status: false, message: "plz give the style " });
         }
    
       if(currencyId){
           if (isEmpty(currencyId))
              return res.status(400).send({ status: false, message: "currencyId required" });
             if (currencyId.trim() !== 'INR')
             return res.status(400).send({ status: false, message: "currencyId must be INR only" });
    
       }
       if(isFreeShipping){
        if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
            return res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean value' })
        }
      }
      if(currencyFormat){
           if (isEmpty(currencyFormat))
                   return res.status(400).send({ status: false, message: "currencyFormat required" });
              if (currencyFormat.trim() !== '₹')
                  return res.status(400).send({ status: false, message: "currencyformat must be ₹ only" });
      }
    
       
            
            if (availableSizes) {
                let validSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                var InputSizes = availableSizes.toUpperCase().split(",").map((s) => s.trim())
                for (let i = 0; i < InputSizes.length; i++) {
                    if (!validSizes.includes(InputSizes[i])) {
                        return res.status(400).send({ status: false, message: "availableSizes must be [S, XS, M, X, L, XXL, XL]" });
                    }
                }
            }
             let productImage = req.files;
             if(productImage && productImage.length>0){
    
                const image = await uploadFile(productImage[0])
             }
         
                
            
    
        
    
    
    
      const updatednewData= await productModel.findOneAndUpdate({ _id: productId, isDeleted: false},
        {
            title:title,
            description:description,
            description:description,
            price:price,
            installments:installments,
            style:style,  
            currencyId:currencyId,
            isFreeShipping:isFreeShipping,
            currencyFormat:currencyFormat,
            productImage:image
        
        
        }, {new:true}
        );
      return res.status(200).send({
        status:true,
        message:"product is updated",
        data:updatednewData
      })
          
    
    }
    
    }catch(err){
        return res.status(500).send({status:false,message:"server error"})
    }
    }
    

module.exports = { createProduct , productByid , getProductByFilter , deleteByid , updateProductById }



//       const getProductByFilter = async function (req, res) {
//     try {

//         const query = req.query;
//         let filters = { isDeleted: false }
//         let sorting = {};

//         let { size, name, priceGreaterThan, priceLessThan, priceSort } = query;

//         if (query.hasOwnProperty('size')) {

//             if (!isValid(size)) {
//                 return res.status(400).send({ status: false, message: `enter at least one size from:  S, XS, M, X, L, XXL, XL` })
//             }

//             let AVAILABLE_SIZES = size.toUpperCase().split(",");
//             for (let i = 0; i < AVAILABLE_SIZES.length; i++) {
//                 if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(AVAILABLE_SIZES[i])) {
//                     return res.status(400).send({ status: false, message: `Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]} value (with multiple value please give saperated by comma)` })
//                 }
//             }

//             filters["availableSizes"] = { $in: AVAILABLE_SIZES }
//         }


//         if (query.hasOwnProperty('name')) {

//             if (!isValid(name)) {
//                 return res.status(400).send({ status: false, message: "name value is not valid" });
//             }

//             filters["title"] = { $regex: name, $options: "i" };
//         }


//         if (query.hasOwnProperty('priceGreaterThan')) {

//             if (isNaN(priceGreaterThan) || !isValidPrice(priceGreaterThan)) {
//                 return res.status(400).send({ status: false, message: "Greater than price should be valid" })
//             }

//             filters["price"] = { $gt: Number(priceGreaterThan) }
//         }


//         if (query.hasOwnProperty('priceLessThan')) {

//             if (isNaN(priceLessThan) || !isValidPrice(priceLessThan)) {
//                 return res.status(400).send({ status: false, message: "Less than price should be valid" })
//             }

//             if (query.hasOwnProperty("priceGreaterThan")) {
//                 filters["price"] = { $gt: Number(priceGreaterThan), $lt: Number(priceLessThan) };
//             }
//             else {
//                 filters["price"] = { $lt: Number(priceLessThan) };
//             }
//         }


//         if (query.hasOwnProperty('priceSort')) {

//             if (!((priceSort == "-1") || (priceSort == "1"))) {
//                 return res.status(400).send({ status: false, message: "price sort should be a number:  -1 or 1" });
//             }

//             sorting["price"] = Number(priceSort);

//             const products = await productModel.find(filters).sort(sorting);
//             if (products.length === 0) {
//                 return res.status(404).send({ productStatus: false, message: 'No Product found' })
//             }

//             return res.status(200).send({ status: true, message: 'Product list', data: products })
//         }

//         const products = await productModel.find(filters);
//         if (products.length === 0) {
//             return res.status(404).send({ productStatus: false, message: 'No Product found' })
//         }

//         res.status(200).send({ status: true, message: 'Product list', data: products })

//     } catch (err) {
//         res.status(500).send({ status: false, msg: err.message })
//     }

// }
