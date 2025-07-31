###############################################################################
# Simple-Tiling – Makefile
#
#  make build             → Erzeugt beide Versionen als Archivdatei
#  make build-legacy      → Erzeugt Legacy-ZIP (Shell 3.38-44)
#  make build-modern      → Erzeugt Modern-ZIP (Shell 45-48)
#  make install-legacy    → Installiert Legacy Extension
#  make install-modern    → Installiert Modern Extension
#  make clean             → Bereinigt das Ausgangsverzeichnis
###############################################################################

UUID     := simple-tiling@domoel
VERSION  := 6
EXTDIR   := $(HOME)/.local/share/gnome-shell/extensions

COMMON_FILES := schemas exceptions.txt locale *.css README.md LICENSE
LEGACY_PREFS := prefs_legacy.js
MODERN_PREFS := prefs_modern.js

###############################################################################
# Helper: copies <file list> <dest>
###############################################################################
define copies
	@for f in $(1) ; do \
		if [ -e $$f ] ; then \
			cp -r $$f $(2)/ ; \
		fi ; \
	done
endef

.PHONY: build build-legacy build-modern \
        install-legacy install-modern clean

build: build-legacy build-modern

###############################################################################
# Erzeugt Legacy-ZIP (Shell 3.38-44)
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
# Erzeugt Modern-ZIP (Shell 45-48)
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
# Installiert Legacy Extension bzw. Modern Extension
###############################################################################
install-legacy:
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

install-modern:
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
# Bereinigt das Ausgangsverzeichnis
###############################################################################
clean:
	@rm -rf build $(UUID)-legacy-v$(VERSION).zip $(UUID)-modern-v$(VERSION).zip
	@echo "Build directory and ZIPs removed."
