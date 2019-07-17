var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var { DocumentSchema } = require("../models/model");
var RuleConfigSchema = new Schema(
    [
        {
            rulesStep: {
                ruleName: String,
                ruleDescription: String
            },
            rulesApplication: {
                countryGroup: String,
                countryName: Array,
                gloabl: Boolean,
                sections: {},
                allSections: Boolean
            },
            action: {
                conflictType: String,
                comments: String,
                modifyLabelOnAccept: Boolean,
                allowReject: Boolean
            },
            additionalInformation: {
                additionalInfo: Boolean,
                fieldName1: String,
                dataValue1: String,
                fieldName2: String,
                dataValue2: String
            },
            exceptionData: {
                dataValue: String,
                listValues: String
            },
            documents: [{ type: mongoose.Schema.ObjectId, ref: DocumentSchema }]
        
        }
    ],
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
    }
);

module.exports = mongoose.model("RuleConfigSchema", RuleConfigSchema);
