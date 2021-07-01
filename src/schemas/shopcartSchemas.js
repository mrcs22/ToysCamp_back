import Joi from "joi";

const shopcartItemSchema = Joi.object({
  productId: Joi.number().min(1).required(),
});

export { shopcartItemSchema };
