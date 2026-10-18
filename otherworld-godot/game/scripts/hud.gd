extends CanvasLayer

var player: CharacterBody3D
var world: Node3D
var message: Label
var directions := {}
var buttons := {}

func _ready() -> void:
	name = "HUD"
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	var panel := PanelContainer.new()
	root.add_child(panel)
	panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	panel.offset_left = 12
	panel.offset_right = -12
	panel.offset_top = 12
	panel.offset_bottom = 12
	var text := VBoxContainer.new()
	panel.add_child(text)
	var title := Label.new()
	title.text = "OTHERWORLD EMBERS · GODOT 2.5D TECHNICAL SLICE"
	title.add_theme_font_size_override("font_size", 18)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text.add_child(title)
	var hint := Label.new()
	hint.text = "WASD / arrows: move  ·  Space: jump  ·  E: collect  ·  Real 3D terrain + sprite hero"
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hint.add_theme_font_size_override("font_size", 14)
	text.add_child(hint)
	message = Label.new()
	message.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	message.add_theme_font_size_override("font_size", 14)
	text.add_child(message)
	var pad := Control.new()
	root.add_child(pad)
	pad.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	pad.offset_left = 12
	pad.offset_top = -144
	pad.offset_right = 188
	pad.offset_bottom = -24
	_direction_button(pad, "U", Vector2(60,0), Vector2.UP)
	_direction_button(pad, "L", Vector2(0,60), Vector2.LEFT)
	_direction_button(pad, "D", Vector2(60,60), Vector2.DOWN)
	_direction_button(pad, "R", Vector2(120,60), Vector2.RIGHT)
	var actions := VBoxContainer.new()
	root.add_child(actions)
	actions.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	actions.offset_left = -144
	actions.offset_top = -144
	actions.offset_right = -12
	actions.offset_bottom = -24
	var collect := Button.new()
	collect.text = "Collect [E]"
	collect.custom_minimum_size = Vector2(132,56)
	collect.pressed.connect(func(): world.interact(player.global_position))
	actions.add_child(collect)
	buttons["collect"] = collect
	var jump := Button.new()
	jump.text = "Jump"
	jump.custom_minimum_size = Vector2(132,56)
	jump.pressed.connect(func(): player.jump_requested = true)
	actions.add_child(jump)
	buttons["jump"] = jump

func _direction_button(parent: Control, title: String, at: Vector2, direction: Vector2) -> void:
	var button := Button.new()
	button.text = title
	button.position = at
	button.size = Vector2(56,56)
	button.add_theme_font_size_override("font_size", 26)
	parent.add_child(button)
	buttons[title] = button
	button.button_down.connect(func(): directions[title] = direction)
	button.button_up.connect(func(): directions.erase(title))

func button_rects() -> Dictionary:
	var rects := {}
	for key in buttons:
		var bounds: Rect2 = buttons[key].get_global_rect()
		rects[key] = {"x": bounds.position.x, "y": bounds.position.y, "width": bounds.size.x, "height": bounds.size.y}
	return rects

func _process(_delta: float) -> void:
	var movement := Vector2.ZERO
	for direction in directions.values():
		movement += direction
	player.touch_direction = movement.limit_length()
	message.text = "%s   |   Height %.2f m" % [world.status, player.position.y]

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.physical_keycode == KEY_E:
		world.interact(player.global_position)
