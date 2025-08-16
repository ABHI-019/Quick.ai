import OpenAI from "openai";
import sql from "../config/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import {v2 as cloudinary} from 'cloudinary';
import FormData from "form-data";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";

const AI= new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});



export const generateArticle = async (req, res) => {
    try{
        const {userId} = req.auth();
        const {prompt, length} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10){
            return res.json({
                error: "You have reached your free usage limit. Please upgrade to premium for more requests."
            });
        }

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [{
                role: "user",
                content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: length ,
        });

        const content = response.choices[0].message.content;

        await sql`INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, ${prompt}, ${content}, 'article')`;

        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            });
        }
        res.json({success: true, content});

    }catch(error) {
        console.error("Error generating article:", error);
        res.status(500).json({ error: "Failed to generate article" });
    }
}


export const generateBlogTitle = async (req, res) => {
    try{
        const {userId} = req.auth();
        const {prompt} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10){
            return res.json({
                error: "You have reached your free usage limit. Please upgrade to premium for more requests."
            });
        }

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [{
                role: "user",
                content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 100 ,
        });

        const content = response.choices[0].message.content;

        await sql`INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            });
        }
        res.json({success: true, content});

    }catch(error) {
        console.error("Error generating blog title:", error);
        res.status(500).json({ error: "Failed to generate blog title" });
    }
}


export const generateImage = async (req, res) => {
    try{
        const {userId} = req.auth();
        const {prompt, publish} = req.body;
        const plan = req.plan;
        
        // Validate required fields
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if(plan !== 'premium' ){
            return res.status(403).json({
                error: "This feature is only available for premium users."
            });
        }

        // Check if required environment variables are set
        if (!process.env.CLIPDROP_API_KEY) {
            console.error("CLIPDROP_API_KEY is not set");
            return res.status(500).json({ error: "Image generation service is not configured" });
        }

        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error("Cloudinary configuration is missing");
            return res.status(500).json({ error: "Image upload service is not configured" });
        }

        const formData = new FormData()
        formData.append('prompt', prompt)

        console.log("Generating image with prompt:", prompt);

        const {data} = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData,{
            headers:{'x-api-key': process.env.CLIPDROP_API_KEY,},
            responseType: "arraybuffer",
        })
        
        console.log("Image generated successfully, uploading to Cloudinary...");
        
        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

        const {secure_url} = await cloudinary.uploader.upload(base64Image)
         
        console.log("Image uploaded to Cloudinary:", secure_url);

        await sql`INSERT INTO creations (user_id, prompt, content, type,publish) 
        VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

        console.log("Image saved to database successfully");
        
        res.json({success: true, content: secure_url});

    }catch(error) {
        console.error("Error generating image:", error);
        
        // More specific error messages
        if (error.response?.status === 401) {
            return res.status(401).json({ error: "Invalid API key for image generation service" });
        }
        if (error.response?.status === 429) {
            return res.status(429).json({ error: "Rate limit exceeded for image generation service" });
        }
        if (error.code === 'ENOTFOUND') {
            return res.status(500).json({ error: "Image generation service is currently unavailable" });
        }
        
        res.status(500).json({ error: "Failed to generate image. Please try again later." });
    }
}

export const removeImagebackground = async (req, res) => {
    try{
        const {userId} = req.auth();
        const image = req.file;
        const plan = req.plan;
        
        // Validate required fields
        if (!image) {
            return res.status(400).json({ error: "image is required" });
        }

        if(plan !== 'premium' ){
            return res.status(403).json({
                error: "This feature is only available for premium users."
            });
        }

        const {secure_url} = await cloudinary.uploader.upload(image.path, {
            transformation: [
                { 
                    effect: "background_removal",
                    background_removal: "remove_the_background"

                }
            ]
        });
        console.log("Image background removed successfully, uploading to Cloudinary...");

        await sql`INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, 'Remove backgroung from image', ${secure_url}, 'image')`;

        console.log("Image saved to database successfully");
        
        res.json({success: true, content: secure_url});

    }catch(error) {
        console.error(error.message);
        
        // More specific error messages
        
        
        res.status(500).json({success: false, message: error.message || "Failed to remove image background. Please try again later."});
    }
}

export const removeImageOject = async (req, res) => {
    try{
        const {userId} = req.auth();
        const {object} = req.body;
        const image = req.file;
        const plan = req.plan;
        
        // Validate required fields
        if (!image) {
            return res.status(400).json({ error: "image is required" });
        }

        if(plan !== 'premium' ){
            return res.status(403).json({
                error: "This feature is only available for premium users."
            });
        }

        const {public_id} = await cloudinary.uploader.upload(image.path);

        const imageUrl = cloudinary.url(public_id,{ 
            transformation: [
                { 
                    effect: `gen_remove:${object}`
                }
            ],
            resource_type: "image"
        });

        console.log("Image background removed successfully, uploading to Cloudinary...");

        await sql`INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

        console.log("Image saved to database successfully");
        
        res.json({success: true, content: imageUrl});

    }catch(error) {
        console.error(error.message);
        res.status(500).json({success: false, message: error.message || "Failed to remove image background. Please try again later."});
    }
}

export const resumeReview = async (req, res) => {
    try{
        const {userId} = req.auth();
        const resume = req.file;
        const plan = req.plan;
        
        // Validate required fields
        if (!resume) {
            return res.status(400).json({ error: "Resume is required" });
        }

        if(plan !== 'premium' ){
            return res.status(403).json({
                error: "This feature is only available for premium users."
            });
        }

        if(resume.size > 5 * 1024 * 1024) { // 5MB limit
            return res.status(400).json({ error: "Resume file size exceeds the 5MB limit" });
        }

        const dataBuffer = fs.readFileSync(resume.path)
        const pdfData = await pdf(dataBuffer);

        const prompt =`Review the resume and provide constructive feedback on its strengths, weakness, and areas for improvement. Resume content:\n\n${pdfData.text}`;
        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [{
                role: "user",
                content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });
        const content = response.choices[0].message.content;

        console.log("Image background removed successfully, uploading to Cloudinary...");

        await sql`INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, 'Review the uploded resume', ${content}, 'resume-review')`;

        console.log("Image saved to database successfully");
        
        res.json({success: true, content});

    }catch(error) {
        console.error(error.message);
        res.status(500).json({success: false, message: error.message });
    }
}