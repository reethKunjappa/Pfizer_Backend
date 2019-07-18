var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var { DocumentSchema } = require("../models/model");
var RuleConfigSchema = new Schema(
    [
        {
            createdBy: {},
            rulesSetup: {
                ruleName: String,
                ruleDescription: String
            },
            rulesApplication: {
                countryGroup: String,
                countryName: Array,
                gloabl: {
                    type: Boolean,
                    default: false
                },
                sections: {},
                allSections: {
                    type: Boolean,
                    default: false
                }
            },
            action: {
                conflictType: String,
                comments: String,
                modifyLabelOnAccept: Boolean,
                allowReject: {
                    type: Boolean,
                    default: false
                }
            },
            additionalInformation: {
                additionalInfo: {
                    type: Boolean,
                    default: false
                },
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
