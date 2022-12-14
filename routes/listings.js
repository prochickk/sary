const express = require("express");
const router = express.Router();
const Joi = require("joi");
const multer = require("multer");


const store = require("../store/listings");
const categoriesStore = require("../store/categories");
const validateWith = require("../middleware/validation");
const auth = require("../middleware/auth");
const delay = require("../middleware/delay");
const config = require("config");
const Idserial = require('../store/Idserial')
const defaultIdSerial = 30000;

const Listing = require('../store/Listing');
const Address = require("../store/Address");

const upload = multer({
  dest: "uploads/",
  limits: { fieldSize: 25 * 1024 * 1024 },
});

const schema = {
  descriptionListing: Joi.string().allow(""),
  typeCateLabelListing: Joi.string().required(),
  timeCateLabelListing: Joi.string().required(),
  groupListing: Joi.string().required(),
  dayCateLabelListing: Joi.string().required(),
  addressCateIdListing: Joi.number().required().min(1),
  addressRegionListing: Joi.string().required().min(1),
  useId: Joi.number().required(),
};

router.get("/", async (req, res) => {
  try {
    let listings = await Listing.find({ useId: req.query.userId});
    // const listings = await store.getListings();

    if (!listings[0]){
      listings = [{
        tripTypeL: "تتم اضافة الرحلات لهذا الأسبوع من الجدول الاسبوعي",
        tripTimeL: '',
        tripDayL: 'لا يوجد أي عنصر',
        addressL: 0,
        idListing: 0,
        // useId: 0,
        }]}

    res.send(listings);
    
  } catch (error) {
    console.log(error.message)
    return res.status(404).send(error.message)
}

});

router.delete("/", async (req, res) => {
  console.log("listingsUser", req.query.listingId)
  const listingId = req.query.listingId
    try {
      
      const listingDelete = await Listing.deleteOne({ 
        idListing: listingId})
      } catch (error) {
        console.log(error.message)
        return res.status(404).send(error.message)
      }
      // res.status(201).send(listing);
  });

router.post(
  "/",
  [upload.array("images", config.get("maxImageCount")),
    validateWith(schema)], async (req, res) => {
    const listing = {
      typeCateLabelL: req.body.typeCateLabelListing,
      timeCateLabelL: req.body.timeCateLabelListing,
      dayCateIdL: req.body.dayCateLabelListing,
      addressCateIdL: req.body.addressCateIdListing,
      descriptionL: req.body.descriptionListing,
      groupL: req.body.groupListing,
      useId: req.body.useId,
    };

    let tripDay = (arabicDay) => {
      if (arabicDay == "الأحد") {return "Sunday"
      } else if (arabicDay == "الأثنين") {return "Monday"
      } else if (arabicDay == "الثلاثاء") {return "Tuesday"
      } else if (arabicDay == "الأربعاء") {return "Wednesday"
      } else {return "Thursday"}
    }

    const convertToAddressObj = await Address.findOne({ idAddress: req.body.addressCateIdListing }) 

    try{
      let IdserialImport = await Idserial.findOne()

      console.log("req.body.addressCateIdListing", req.body.addressCateIdListing)

      if (!IdserialImport.idListing) {
        await Idserial.updateOne(IdserialImport, { idListing: defaultIdSerial})
        IdserialImport = await Idserial.findOne();}
      
      
      const IdserialDbUpdate = await Idserial.updateOne(
        { idListing: IdserialImport.idListing},
        { $inc: { idListing: 1 }});

    const listingdb = await Listing.create({
      tripTypeL: req.body.typeCateLabelListing,
      tripTimeL: req.body.timeCateLabelListing,
      tripDayL: req.body.dayCateLabelListing,
      tripDayEng: tripDay(req.body.dayCateLabelListing),
      addressL: convertToAddressObj.location,
      addressRegionL: req.body.addressRegionListing,
      descriptionL: req.body.descriptionListing,
      groupL: req.body.groupListing,
      useId: req.body.useId,
      idListing: IdserialImport.idListing + 1,
    })
      
  } catch (error) {
    console.log(error.message)
    return res.status(404).send(error.message)
  }
    res.status(201).send(listing);
  }
);

module.exports = router;
