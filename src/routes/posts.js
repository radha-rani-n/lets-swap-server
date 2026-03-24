"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const postsControllerFirebase_1 = require("../controllers/postsControllerFirebase");
const router = express_1.default.Router();
router.post("/", postsControllerFirebase_1.addPost);
router.get("/", postsControllerFirebase_1.getAllPosts);
router.get("/userPosts", postsControllerFirebase_1.getUserPosts);
router.patch("/:postId/status", postsControllerFirebase_1.updatePostStatus);
router.delete("/:postId", postsControllerFirebase_1.deleteUserPost);
router.get("/geocode", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ error: "lat and lng are required" });
    }
    try {
        const apiKey = process.env.OPENCAGE_API_KEY;
        const response = yield axios_1.default.get(`https://api.opencagedata.com/geocode/v1/json?q=${lat}%2C+${lng}&key=${apiKey}`);
        res.json(response.data.results[0].components);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch location" });
    }
}));
exports.default = router;
