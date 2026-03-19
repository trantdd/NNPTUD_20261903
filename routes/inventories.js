var express = require("express");
var router = express.Router();
let inventoryModel = require("../schemas/inventories");

function getQuantity(value) {
  let quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return null;
  }
  return quantity;
}

function validateStockPayload(req, res) {
  let { product, quantity } = req.body;
  let normalizedQuantity = getQuantity(quantity);

  if (!product) {
    res.status(400).send({
      message: "product is required",
    });
    return null;
  }

  if (!normalizedQuantity) {
    res.status(400).send({
      message: "quantity must be a positive integer",
    });
    return null;
  }

  return {
    product,
    quantity: normalizedQuantity,
  };
}

router.get("/", async function (req, res) {
  try {
    let data = await inventoryModel.find({}).populate({
      path: "product",
    });
    res.send(data);
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});

router.get("/:id", async function (req, res) {
  try {
    let result = await inventoryModel.findById(req.params.id).populate({
      path: "product",
    });

    if (!result) {
      return res.status(404).send({
        message: "ID NOT FOUND",
      });
    }

    res.send(result);
  } catch (error) {
    res.status(404).send({
      message: error.message,
    });
  }
});

router.post("/add_stock", async function (req, res) {
  let payload = validateStockPayload(req, res);
  if (!payload) return;

  try {
    let result = await inventoryModel
      .findOneAndUpdate(
        { product: payload.product },
        {
          $inc: {
            stock: payload.quantity,
          },
        },
        { new: true },
      )
      .populate({ path: "product" });

    if (!result) {
      return res.status(404).send({
        message: "INVENTORY NOT FOUND",
      });
    }

    res.send(result);
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});

router.post("/remove_stock", async function (req, res) {
  let payload = validateStockPayload(req, res);
  if (!payload) return;

  try {
    let result = await inventoryModel
      .findOneAndUpdate(
        {
          product: payload.product,
          stock: { $gte: payload.quantity },
        },
        {
          $inc: {
            stock: -payload.quantity,
          },
        },
        { new: true },
      )
      .populate({ path: "product" });

    if (!result) {
      let inventory = await inventoryModel.findOne({
        product: payload.product,
      });
      if (!inventory) {
        return res.status(404).send({
          message: "INVENTORY NOT FOUND",
        });
      }

      return res.status(400).send({
        message: "STOCK NOT ENOUGH",
      });
    }

    res.send(result);
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});

router.post("/reservation", async function (req, res) {
  let payload = validateStockPayload(req, res);
  if (!payload) return;

  try {
    let result = await inventoryModel
      .findOneAndUpdate(
        {
          product: payload.product,
          stock: { $gte: payload.quantity },
        },
        {
          $inc: {
            stock: -payload.quantity,
            reserved: payload.quantity,
          },
        },
        { new: true },
      )
      .populate({ path: "product" });

    if (!result) {
      let inventory = await inventoryModel.findOne({
        product: payload.product,
      });
      if (!inventory) {
        return res.status(404).send({
          message: "INVENTORY NOT FOUND",
        });
      }

      return res.status(400).send({
        message: "STOCK NOT ENOUGH",
      });
    }

    res.send(result);
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});

router.post("/sold", async function (req, res) {
  let payload = validateStockPayload(req, res);
  if (!payload) return;

  try {
    let result = await inventoryModel
      .findOneAndUpdate(
        {
          product: payload.product,
          reserved: { $gte: payload.quantity },
        },
        {
          $inc: {
            reserved: -payload.quantity,
            soldCount: payload.quantity,
          },
        },
        { new: true },
      )
      .populate({ path: "product" });

    if (!result) {
      let inventory = await inventoryModel.findOne({
        product: payload.product,
      });
      if (!inventory) {
        return res.status(404).send({
          message: "INVENTORY NOT FOUND",
        });
      }

      return res.status(400).send({
        message: "RESERVED NOT ENOUGH",
      });
    }

    res.send(result);
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});

module.exports = router;
