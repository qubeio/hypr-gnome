###############################################################################
# Simple‑Tiling – Makefile
#
#  make build         → baut beide ZIP‑Pakete
#  make build-legacy  → nur Legacy‑ZIP  (Shell 3.38‑44)
#  make build-modern  → nur Modern‑ZIP  (Shell 45‑48)
#  make clean         → räumt auf
###############################################################################

UUID     := simple-tiling@domoel
VERSION  := 6

# Dateien/Ordner, die in *beide* Pakete gehören
COMMON_FILES := schemas exceptions.txt locale *.css README.md LICENSE

# Pref‑Dateien (zwei Varianten)
LEGACY_PREFS  := prefs_legacy.js
MODERN_PREFS  := prefs_modern.js

###############################################################################
# Helfer: copies <file list> <dest>
###############################################################################
define copies
	@for f in $(1) ; do \
		if [ -e $$f ] ; then \
			cp -r $$f $(2)/ ; \
		fi ; \
	done
endef

.PHONY: build build-legacy build-modern clean
build: build-legacy build-modern

###############################################################################
# Legacy‑Build
###############################################################################
build-legacy:
	@echo "==> Building LEGACY package (3.38‑44)…"
	@rm -rf build && mkdir -p build/$(UUID)
	$(call copies,$(COMMON_FILES),build/$(UUID))

	# Schema kompilieren
	@glib-compile-schemas build/$(UUID)/schemas

	# Haupt‑ und Pref‑Skript
	@cp legacy.js       build/$(UUID)/extension.js
	@cp $(LEGACY_PREFS) build/$(UUID)/prefs.js

	# metadata.json anpassen
	@sed -e "s/__UUID__/$(UUID)/g" \
	     -e "s/__VERSION__/$(VERSION)/g" \
	     metadata_legacy.json.in > build/$(UUID)/metadata.json

	# Zip‑Paket
	@cd build && zip -qr ../$(UUID)-legacy-v$(VERSION).zip .
	@rm -rf build
	@echo "✓ created $(UUID)-legacy-v$(VERSION).zip"

###############################################################################
# Modern‑Build
###############################################################################
build-modern:
	@echo "==> Building MODERN package (45‑48)…"
	@rm -rf build && mkdir -p build/$(UUID)
	$(call copies,$(COMMON_FILES),build/$(UUID))

	# Schema kompilieren
	@glib-compile-schemas build/$(UUID)/schemas

	# Haupt‑ und Pref‑Skript
	@cp modern.js       build/$(UUID)/extension.js
	@cp $(MODERN_PREFS) build/$(UUID)/prefs.js

	# metadata.json anpassen
	@sed -e "s/__UUID__/$(UUID)/g" \
	     -e "s/__VERSION__/$(VERSION)/g" \
	     metadata_modern.json.in > build/$(UUID)/metadata.json

	# Zip‑Paket
	@cd build && zip -qr ../$(UUID)-modern-v$(VERSION).zip .
	@rm -rf build
	@echo "✓ created $(UUID)-modern-v$(VERSION).zip"

###############################################################################
clean:
	@rm -rf build $(UUID)-legacy-v$(VERSION).zip $(UUID)-modern-v$(VERSION).zip
	@echo "Build‑Ordner und ZIPs entfernt."
