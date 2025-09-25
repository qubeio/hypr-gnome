###############################################################################
# Hypr-GNOME – Makefile
#
#  make build            → Erzeugt Extension als Archivdatei
#  make install          → Installiert Extension
#  make clean            → Bereinigt das Ausgangsverzeichnis
###############################################################################

UUID     := hypr-gnome@qubeio.com
VERSION  := 2.0
EXTDIR   := $(HOME)/.local/share/gnome-shell/extensions

COMMON_FILES   := schemas exceptions.txt locale *.css README.md LICENSE

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

.PHONY: build install clean

###############################################################################
# Erzeugt Extension-ZIP (GNOME Shell 45+)
###############################################################################
build:
	@echo "==> Building Hypr-GNOME extension..."
	@rm -rf build && mkdir -p build/$(UUID)
	$(call copies,$(COMMON_FILES),build/$(UUID))
	@glib-compile-schemas build/$(UUID)/schemas
	@cp extension.js     build/$(UUID)/extension.js
	@cp prefs_modern.js  build/$(UUID)/prefs.js
	@sed -e "s/__UUID__/$(UUID)/g" \
	     -e "s/__VERSION__/$(VERSION)/g" \
	     metadata_modern.json.in > build/$(UUID)/metadata.json
	@cd build && zip -qr ../$(UUID)-v$(VERSION).zip .
	@rm -rf build
	@echo "✓  $(UUID)-v$(VERSION).zip created"

###############################################################################
# Installiert die Extension
###############################################################################
install: build
	@echo "==> Installing Hypr-GNOME Extension..."
	@rm -rf $(EXTDIR)/$(UUID)
	@unzip -q $(UUID)-v$(VERSION).zip -d $(EXTDIR)
	@rm -f $(UUID)-v$(VERSION).zip
	@echo "✓  Hypr-GNOME Extension installed to $(EXTDIR)/$(UUID). Restart GNOME Shell to apply."

###############################################################################
# Bereinigt das Ausgangsverzeichnis
###############################################################################
clean:
	@rm -f $(UUID)-*.zip
	@echo "Build directory and ZIPs removed."
