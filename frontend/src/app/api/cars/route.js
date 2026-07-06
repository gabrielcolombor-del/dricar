import { NextResponse } from "next/server";
import Papa from "papaparse";
import fs from "fs";
import path from "path";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";
    let csvContent = "";
    
    // Check if there is an environment variable for Google Sheets CSV URL
    const sheetUrl = process.env.NEXT_PUBLIC_SHEET_CSV_URL;
    
    if (sheetUrl) {
      // Fetch from Google Sheets and revalidate cache every 60 seconds, with tag "cars" for manual revalidation
      const response = await fetch(sheetUrl, { next: { revalidate: 60, tags: ["cars"] } });
      if (response.ok) {
        csvContent = await response.text();
      }
    }
    
    // Fallback: If no sheetUrl or fetch failed, read local CSV file
    if (!csvContent) {
      const filePath = path.join(process.cwd(), "public", "data", "veiculos.csv");
      csvContent = fs.readFileSync(filePath, "utf8");
    }

    // Parse CSV to JSON
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    // Format fields (convert categories, accessories to array, ensure prices/mileage are readable)
    const cars = parsed.data
      .map((car) => {
        // Split accessories by comma and trim whitespaces
        const accessoriesList = car.accessories 
          ? car.accessories.split(",").map(item => item.trim()).filter(Boolean)
          : [];

        return {
          ...car,
          accessories: accessoriesList,
        };
      })
      // Filter: show all if requested, otherwise show only active (or blank status)
      .filter((car) => showAll || !car.status || car.status.toLowerCase() === "ativo");


    return NextResponse.json(cars);
  } catch (error) {
    console.error("Backend Database Error:", error);
    return NextResponse.json({ error: "Failed to retrieve database content" }, { status: 500 });
  }
}
