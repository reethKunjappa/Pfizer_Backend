var mongoose = require("mongoose");
var Schema = mongoose.Schema;
//var CountryConfigDocSchema = require('../models/countryConfigDoc.model')
var { DocumentSchema } = require("../models/model");
var CountryConfigSchema = new Schema(
    [
        {
            createdBy: {},
            country: [],
            countryGrouping: String,
            languagePreference: String,
            
            documents: [{ type: mongoose.Schema.ObjectId, ref: DocumentSchema }]
            
        }
    ],
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
    }
);

module.exports = mongoose.model("CountryConfigSchema", CountryConfigSchema);
