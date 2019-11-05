"use strict";

module.exports = {
  definitions: {
    address: {
      required: ["streetAddress", "city", "state"],
      $id: "#address",
      type: "object",
      properties: {
        streetAddress: {
          type: "string"
        },
        city: {
          type: "string"
        },
        state: {
          type: "string"
        }
      }
    }
  },
  type: "object",
  properties: {
    billingAddress: {
      $id: "#address",
      required: ["streetAddress", "city", "state"],
      type: "object",
      properties: {
        streetAddress: {
          type: "string"
        },
        city: {
          type: "string"
        },
        state: {
          type: "string"
        }
      }
    },
    shippingAddress: {
      $id: "#address",
      required: ["streetAddress", "city", "state"],
      type: "object",
      properties: {
        streetAddress: {
          type: "string"
        },
        city: {
          type: "string"
        },
        state: {
          type: "string"
        }
      }
    }
  },
  title: "Customer"
};
