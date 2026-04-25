export const lookupBarcode = async (barcode) => {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
  const data = await res.json()

  if (data.status === 0) {
    return null
  }

  const product = data.product
  return {
    name: product.product_name || product.product_name_en || '',
    brand: product.brands || '',
    quantity: product.quantity || '',
    categories: product.categories || '',
    nutrition: {
      calories: product.nutriments?.['energy-kcal_100g'] || null,
      protein: product.nutriments?.proteins_100g || null,
      carbs: product.nutriments?.carbohydrates_100g || null,
      fat: product.nutriments?.fat_100g || null,
      fiber: product.nutriments?.fiber_100g || null,
      sugar: product.nutriments?.sugars_100g || null,
      sodium: product.nutriments?.sodium_100g ? (product.nutriments.sodium_100g * 1000).toFixed(0) : null,
    },
    image: product.image_front_small_url || null,
    barcode,
  }
}