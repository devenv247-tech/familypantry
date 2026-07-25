import DishArt from './DishArt'
import { getRecipeCategory } from '../../utils/recipeImagery'

// Warm food-50 illustration panel that sits flush at the top of a .card (p-5).
// Uses -mx-5 -mt-5 to bleed to card edges, rounded-t-card to match card radius.
export default function RecipeCardHeader({ title }) {
  const category = getRecipeCategory(title)
  return (
    <div className="bg-food-50 rounded-t-card -mx-5 -mt-5 mb-4 flex justify-center items-center py-5 sm:py-6 overflow-hidden">
      <DishArt category={category} size="md" />
    </div>
  )
}
