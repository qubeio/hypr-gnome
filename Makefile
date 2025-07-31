###############################################################################
# Simple-Tiling – Makefile
#
#  make build            → beide ZIP-Pakete
#  make build-legacy     → nur Legacy-ZIP  (Shell 3.38-44)
#  make build-modern     → nur Modern-ZIP  (Shell 45-48)
#  make build-legacy-go  → Legacy-Ordner direkt ins Extension-Verzeichnis
#  make build-modern-go  → Modern-Ordner direkt ins Extension-Verzeichnis
#  make clean            → räumt auf
###############################################################################

UUID     := simple-tiling@domoel
VERSION  := 6
EXTDIR   := $(HOME)/.local/share/gnome-shell/extensions

COMMON_FILES := schemas exceptions.txt locale *.css README.md LICENSE
LEGACY_PREFS := prefs_legacy.js
MODERN_PREFS := prefs_modern.js

###############################################################################
define copies
	@for f in $(1) ; do \
		if [ -e $$f ] ; then \
			cp -r $$f $(2)/ ; \
		fi ; \
	done
endef

.PHONY: build build-legacy build-modern \
        build-legacy-go build-modern-go \
        clean

build: build-legacy build-modern

###############################################################################
# Legacy-ZIP (3.38-44)
###############################################################################
build-legacy:
	@echo "==> Building LEGACY zip …"
	@rm -rf build && mkdir -p build/$(UUID)
	$(call copies,$(COMMON_FILES),build/$(UUID))
	@glib-compile-schemas build/$(UUID)/schemas
	@cp legacy.js       build/$(UUID)/extension.js
	@cp $(LEGACY_PREFS) build/$(UUID)/prefs.js
	@sed -e "s/__UUID__/$(UUID)/g" \
	     -e "s/__VERSION__/$(VERSION)/g" \
	     metadata_legacy.json.in > build/$(UUID)/metadata.json
	@cd build && zip -qr ../$(UUID)-legacy-v$(VERSION).zip .
	@rm -rf build
	@echo "✓  $(UUID)-legacy-v$(VERSION).zip created"

###############################################################################
# Modern-ZIP (45-48)
###############################################################################
build-modern:
	@echo "==> Building MODERN zip …"
	@rm -rf build && mkdir -p build/$(UUID)
	$(call copies,$(COMMON_FILES),build/$(UUID))
	@glib-compile-schemas build/$(UUID)/schemas
	@cp modern.js       build/$(UUID)/extension.js
	@cp $(MODERN_PREFS) build/$(UUID)/prefs.js
	@sed -e "s/__UUID__/$(UUID)/g" \
	     -e "s/__VERSION__/$(VERSION)/g" \
	     metadata_modern.json.in > build/$(UUID)/metadata.json
	@cd build && zip -qr ../$(UUID)-modern-v$(VERSION).zip .
	@rm -rf build
	@echo "✓  $(UUID)-modern-v$(VERSION).zip created"

###############################################################################
# “Go”-Targets – Ordner direkt installieren
###############################################################################
build-legacy-go:
	@echo "==> Building & installing LEGACY folder …"
	@rm -rf build && mkdir -p build/$(UUID)
	$(call copies,$(COMMON_FILES),build/$(UUID))
	@glib-compile-schemas build/$(UUID)/schemas
	@cp legacy.js       build/$(UUID)/extension.js
	@cp $(LEGACY_PREFS) build/$(UUID)/prefs.js
	@sed -e "s/__UUID__/$(UUID)/g" \
	     -e "s/__VERSION__/$(VERSION)/g" \
	     metadata_legacy.json.in > build/$(UUID)/metadata.json
	@rm -rf $(EXTDIR)/$(UUID)
	@mkdir -p $(EXTDIR)
	@mv build/$(UUID) $(EXTDIR)/
	@rm -rf build
	@echo "✓  Installed to $(EXTDIR)/$(UUID)"

build-modern-go:
	@echo "==> Building & installing MODERN folder …"
	@rm -rf build && mkdir -p build/$(UUID)
	$(call copies,$(COMMON_FILES),build/$(UUID))
	@glib-compile-schemas build/$(UUID)/schemas
	@cp modern.js       build/$(UUID)/extension.js
	@cp $(MODERN_PREFS) build/$(UUID)/prefs.js
	@sed -e "s/__UUID__/$(UUID)/g" \
	     -e "s/__VERSION__/$(VERSION)/g" \
	     metadata_modern.json.in > build/$(UUID)/metadata.json
	@rm -rf $(EXTDIR)/$(UUID)
	@mkdir -p $(EXTDIR)
	@mv build/$(UUID) $(EXTDIR)/
	@rm -rf build
	@echo "✓  Installed to $(EXTDIR)/$(UUID)"

###############################################################################
clean:
	@rm -rf build $(UUID)-legacy-v$(VERSION).zip $(UUID)-modern-v$(VERSION).zip
	@echo "Build directory and ZIPs removed."
