.PHONY: setup validate studio render clean

setup:
	npm install

validate:
	npm run validate

studio:
	npm run remotion:studio

render:
	npm run remotion:render

# Removes generated renders only; keeps tracked .gitkeep placeholders.
clean:
	rm -rf out .remotion
	find output channels/*/renders -mindepth 1 ! -name .gitkeep -delete
