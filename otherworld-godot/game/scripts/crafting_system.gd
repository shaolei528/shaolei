extends RefCounted
class_name CraftingSystem

const RECIPES := {
	"campfire": {"ember": 1}
}

var inventory: Dictionary = {}

func add_item(item_id: String, amount: int = 1) -> void:
	if amount <= 0:
		return
	inventory[item_id] = count(item_id) + amount

func count(item_id: String) -> int:
	return int(inventory.get(item_id, 0))

func can_craft(recipe_id: String) -> bool:
	if not RECIPES.has(recipe_id):
		return false
	var ingredients: Dictionary = RECIPES[recipe_id]
	for item_id in ingredients:
		if count(str(item_id)) < int(ingredients[item_id]):
			return false
	return true

func craft(recipe_id: String) -> bool:
	if not can_craft(recipe_id):
		return false
	var ingredients: Dictionary = RECIPES[recipe_id]
	for item_id in ingredients:
		var remaining := count(str(item_id)) - int(ingredients[item_id])
		if remaining == 0:
			inventory.erase(item_id)
		else:
			inventory[item_id] = remaining
	return true
