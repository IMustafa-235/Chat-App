const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const cloudinary = require("cloudinary").v2;

setGlobalOptions({
  maxInstances: 10,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.deleteImage = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    console.log("=================================");
    console.log("DELETE IMAGE FUNCTION CALLED");
    console.log("Method:", req.method);
    console.log("Body:", req.body);
    console.log("=================================");

    // Only POST allowed
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Only POST requests are allowed",
      });
    }

    try {
      const { publicId } = req.body;

      console.log("Received publicId:", publicId);

      if (!publicId) {
        return res.status(400).json({
          success: false,
          error: "publicId is required",
        });
      }

      console.log("Deleting from Cloudinary:", publicId);

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        type: "upload",
        invalidate: true,
      });

      console.log("Cloudinary result:", result);

      if (result.result !== "ok") {
        return res.status(400).json({
          success: false,
          error: "Cloudinary did not delete the image",
          cloudinaryResult: result,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Image deleted successfully",
        publicId,
        cloudinaryResult: result,
      });
    } catch (error) {
      console.error("=================================");
      console.error("CLOUDINARY DELETE ERROR");
      console.error(error);
      console.error("=================================");

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to delete image",
      });
    }
  }
);
